import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateSubscriptionRequest {
  vendorId: string;
  newPlan: string;
  requestId?: string;
  action?: 'approve' | 'reject';
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { vendorId, newPlan, requestId, action, adminNotes }: UpdateSubscriptionRequest = await req.json();

    if (!vendorId || !newPlan) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: vendorId, newPlan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate plan
    const validPlans = ['free', 'basic', 'premium', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update vendor_profiles subscription_plan
    const { error: updateError } = await supabaseAdmin
      .from("vendor_profiles")
      .update({ 
        subscription_plan: newPlan,
        subscription_status: newPlan === 'free' ? 'inactive' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq("user_id", vendorId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update subscription" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If there's a request ID, update the subscription_requests table
    if (requestId) {
      const status = action === 'reject' ? 'rejected' : 'approved';
      
      await supabaseAdmin
        .from("subscription_requests")
        .update({
          status: status,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          admin_notes: adminNotes
        })
        .eq("id", requestId);
    }

    // Get vendor profile for notification
    const { data: vendorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", vendorId)
      .single();

    // Create notification for vendor
    const notificationMessage = action === 'reject'
      ? `Your subscription upgrade request has been rejected.${adminNotes ? ` Reason: ${adminNotes}` : ''}`
      : `Your subscription has been updated to ${newPlan} plan.`;

    await supabaseAdmin.from("notifications").insert({
      user_id: vendorId,
      title: action === 'reject' ? "Subscription Request Rejected" : "Subscription Updated",
      message: notificationMessage,
      type: action === 'reject' ? "warning" : "success",
      action_url: "/vendor/subscription"
    });

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "ADMIN_UPDATE_VENDOR_SUBSCRIPTION",
      table_name: "vendor_profiles",
      record_id: vendorId,
      new_values: { 
        new_plan: newPlan, 
        action: action,
        request_id: requestId,
        admin_notes: adminNotes 
      }
    });

    console.log(`Admin ${user.id} updated vendor ${vendorId} subscription to ${newPlan}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Subscription ${action === 'reject' ? 'request rejected' : 'updated'} successfully`,
        vendorId,
        newPlan
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Admin update subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
