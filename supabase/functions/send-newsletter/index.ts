import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  subscriptionType?: "daily" | "weekly" | "monthly";
  testEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter function invoked");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please add RESEND_API_KEY." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subscriptionType = "weekly", testEmail }: NewsletterRequest = await req.json();
    
    console.log(`Processing ${subscriptionType} newsletter${testEmail ? ` (test to ${testEmail})` : ""}`);

    // Get latest news articles
    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("title, description, url, image_url, source, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(10);

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
      throw articlesError;
    }

    if (!articles || articles.length === 0) {
      console.log("No articles to send");
      return new Response(
        JSON.stringify({ message: "No articles available for newsletter" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get subscribers
    let subscribersQuery = supabase
      .from("newsletter_subscriptions")
      .select("email, subscription_type")
      .eq("is_active", true);

    if (testEmail) {
      subscribersQuery = subscribersQuery.eq("email", testEmail);
    } else {
      subscribersQuery = subscribersQuery.eq("subscription_type", subscriptionType);
    }

    const { data: subscribers, error: subscribersError } = await subscribersQuery;

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      throw subscribersError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found");
      return new Response(
        JSON.stringify({ message: "No subscribers for this frequency" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending to ${subscribers.length} subscriber(s)`);

    // Build email HTML
    const articleListHtml = articles.map(article => `
      <tr>
        <td style="padding: 20px 0; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">
            <a href="${article.url}" style="color: #1a1a1a; text-decoration: none;">${article.title}</a>
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; line-height: 1.4;">
            ${article.description || ''}
          </p>
          <span style="font-size: 12px; color: #999;">${article.source}</span>
        </td>
      </tr>
    `).join('');

    const frequencyLabel = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly"
    }[subscriptionType];

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #d4af37; font-size: 28px; font-weight: 700;">Monarch Property News</h1>
              <p style="margin: 10px 0 0 0; color: #ccc; font-size: 14px;">${frequencyLabel} Property News Digest</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #1a1a1a;">Latest Property News</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articleListHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                You're receiving this because you subscribed to ${frequencyLabel.toLowerCase()} updates.
              </p>
              <a href="https://monarchpropertymmgt.com/news" style="display: inline-block; padding: 10px 20px; background-color: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Read More News
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send emails using Resend API directly
    let successCount = 0;
    let errorCount = 0;

    for (const subscriber of subscribers) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Monarch Property News <onboarding@resend.dev>",
            to: [subscriber.email],
            subject: `${frequencyLabel} Property News Digest - ${new Date().toLocaleDateString()}`,
            html: emailHtml,
          })
        });

        if (response.ok) {
          successCount++;
          console.log(`Email sent to ${subscriber.email}`);
        } else {
          errorCount++;
          const errorData = await response.json();
          console.error(`Failed to send to ${subscriber.email}:`, errorData);
        }
      } catch (err) {
        errorCount++;
        console.error(`Failed to send to ${subscriber.email}:`, err);
      }
    }

    console.log(`Newsletter complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: errorCount,
        articleCount: articles.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Newsletter error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
