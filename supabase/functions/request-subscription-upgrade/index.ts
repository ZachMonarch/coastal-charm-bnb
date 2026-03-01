import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface SubscriptionRequestBody {
  requestedPlan: string;
  currentPlan?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

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
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { requestedPlan, currentPlan }: SubscriptionRequestBody = await req.json();

    if (!requestedPlan) {
      return new Response(
        JSON.stringify({ error: "Missing required field: requestedPlan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate plan
    const validPlans = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(requestedPlan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be: basic, premium, or enterprise" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from("subscription_requests")
      .select("id, status, requested_plan")
      .eq("vendor_id", user.id)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ 
          error: "You already have a pending subscription request",
          existingRequest: {
            id: existingRequest.id,
            requestedPlan: existingRequest.requested_plan
          }
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create subscription request
    const { data: request, error: insertError } = await supabaseAdmin
      .from("subscription_requests")
      .insert({
        vendor_id: user.id,
        current_plan: currentPlan || 'free',
        requested_plan: requestedPlan,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription request" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile for notification
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Create notification for admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: "New Subscription Request",
        message: `${profile?.full_name || 'A vendor'} has requested an upgrade to ${requestedPlan} plan.`,
        type: "info",
        action_url: "/admin/vendors?tab=subscriptions"
      }));

      await supabaseAdmin.from("notifications").insert(notifications);
    }

    // Create confirmation notification for vendor
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Subscription Request Submitted",
      message: `Your request to upgrade to ${requestedPlan} plan has been submitted. An admin will review it shortly.`,
      type: "success",
      action_url: "/vendor/subscription"
    });

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "SUBSCRIPTION_REQUEST_CREATED",
      table_name: "subscription_requests",
      record_id: request.id,
      new_values: { requested_plan: requestedPlan, current_plan: currentPlan }
    });

    console.log(`Subscription request created: ${request.id} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Subscription upgrade request submitted successfully",
        request: {
          id: request.id,
          requestedPlan: request.requested_plan,
          status: request.status
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Request subscription upgrade error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
