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
  console.log('[admin-update-vendor-subscription] Function invoked at:', new Date().toISOString());
  console.log('[admin-update-vendor-subscription] Method:', req.method);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log('[admin-update-vendor-subscription] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log('[admin-update-vendor-subscription] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[admin-update-vendor-subscription] Missing environment variables');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user from auth header - extract Bearer token explicitly
    const authHeader = req.headers.get("Authorization");
    console.log('[admin-update-vendor-subscription] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[admin-update-vendor-subscription] No or invalid authorization header');
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract the JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Pass the token explicitly to getUser() for edge function context
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    console.log('[admin-update-vendor-subscription] User check:', {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message
    });
    
    if (userError || !user) {
      console.error('[admin-update-vendor-subscription] Auth failed:', userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: adminRole, error: adminError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    console.log('[admin-update-vendor-subscription] Admin check:', {
      isAdmin: !!adminRole,
      error: adminError?.message
    });

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { vendorId, newPlan, requestId, action, adminNotes }: UpdateSubscriptionRequest = await req.json();

    console.log('Request received:', { vendorId, newPlan, requestId, action, adminNotes });

    if (!vendorId || !newPlan) {
      console.error('Missing required fields:', { vendorId, newPlan });
      return new Response(
        JSON.stringify({ error: "Missing required fields: vendorId, newPlan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate plan
    const validPlans = ['free', 'basic', 'premium', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      console.error('Invalid plan:', newPlan);
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
