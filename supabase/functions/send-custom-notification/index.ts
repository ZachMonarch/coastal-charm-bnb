import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomNotificationRequest {
  notificationType: string;
  recipientType: string;
  individualUserId?: string;
  title: string;
  message: string;
  priority: string;
  deliveryMethod: string;
  actionUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-custom-notification: Starting request processing");

    // Authenticate request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("send-custom-notification: No auth header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("send-custom-notification: Auth failed", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Admin client for role checks and data access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      console.error("send-custom-notification: Not admin");
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body: CustomNotificationRequest = await req.json();
    const { notificationType, recipientType, individualUserId, title, message, priority, deliveryMethod, actionUrl } = body;

    console.log(`send-custom-notification: Type=${notificationType}, Recipient=${recipientType}`);

    // Get recipient user IDs based on type
    let recipientIds: string[] = [];

    if (recipientType === "individual" && individualUserId) {
      recipientIds = [individualUserId];
    } else {
      // Fetch users based on recipient type
      let query = supabaseAdmin.from("profiles").select("id, email");
      
      if (recipientType === "all_vendors") {
        const { data: vendorProfiles } = await supabaseAdmin
          .from("vendor_profiles")
          .select("user_id");
        recipientIds = vendorProfiles?.map(v => v.user_id) || [];
      } else if (recipientType === "all_property_managers") {
        const { data: pmRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "property_manager");
        recipientIds = pmRoles?.map(r => r.user_id) || [];
      } else if (recipientType === "all_tenants") {
        const { data: tenantRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "tenant");
        recipientIds = tenantRoles?.map(r => r.user_id) || [];
      } else if (recipientType === "all_users") {
        const { data: allProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .limit(500);
        recipientIds = allProfiles?.map(p => p.id) || [];
      }
    }

    console.log(`send-custom-notification: Found ${recipientIds.length} recipients`);

    if (recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No recipients found", sentCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create in-app notifications
    if (deliveryMethod === "in_app" || deliveryMethod === "both") {
      const notifications = recipientIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type: notificationType === "payment_request" ? "warning" : 
              notificationType === "award_notice" ? "success" : "info",
        priority,
        action_url: actionUrl || null,
        category: notificationType,
      }));

      const { error: notifyError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (notifyError) {
        console.error("send-custom-notification: Error creating notifications", notifyError);
      } else {
        console.log(`send-custom-notification: Created ${notifications.length} in-app notifications`);
      }
    }

    // Send emails
    if (deliveryMethod === "email" || deliveryMethod === "both") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);

        // Get email addresses
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", recipientIds);

        const siteUrl = Deno.env.get("SITE_URL") || "https://monarchpropertymmgt.com";

        for (const profile of profiles || []) {
          if (!profile.email) continue;

          try {
            await resend.emails.send({
              from: "Monarch Property Management <notifications@monarchpropertymmgt.com>",
              to: [profile.email],
              subject: title,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #d4af37, #b8860b); padding: 20px; text-align: center;">
                    <h1 style="color: #1a1a1a; margin: 0;">Monarch Property Management</h1>
                  </div>
                  <div style="padding: 30px; background: #ffffff;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">${title}</h2>
                    <p style="color: #333333; line-height: 1.6;">Hello ${profile.full_name || "there"},</p>
                    <p style="color: #333333; line-height: 1.6;">${message}</p>
                    ${actionUrl ? `
                      <a href="${siteUrl}${actionUrl}" 
                         style="display: inline-block; background: #d4af37; color: #1a1a1a; 
                                padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                                margin-top: 20px; font-weight: bold;">
                        View Details
                      </a>
                    ` : ""}
                  </div>
                  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                    <p>© ${new Date().getFullYear()} Monarch Property Management. All rights reserved.</p>
                  </div>
                </div>
              `,
            });
            console.log(`send-custom-notification: Email sent to ${profile.email}`);
          } catch (emailError) {
            console.error(`send-custom-notification: Failed to send email to ${profile.email}`, emailError);
          }
        }
      } else {
        console.warn("send-custom-notification: RESEND_API_KEY not configured");
      }
    }

    // Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "ADMIN_SEND_NOTIFICATION",
      table_name: "notifications",
      new_values: {
        notification_type: notificationType,
        recipient_type: recipientType,
        recipient_count: recipientIds.length,
        delivery_method: deliveryMethod,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifications sent successfully",
        sentCount: recipientIds.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("send-custom-notification: Error", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
