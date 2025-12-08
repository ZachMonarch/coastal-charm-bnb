import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractAwardRequest {
  contract_id: string;
  vendor_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { contract_id, vendor_id }: ContractAwardRequest = await req.json();

    console.log(`Sending contract award notification for contract ${contract_id}`);

    // Fetch contract and vendor details
    const [{ data: contract }, { data: vendor }] = await Promise.all([
      supabaseClient
        .from("contracts")
        .select("title, contract_number, contract_value, start_date, end_date")
        .eq("id", contract_id)
        .single(),
      supabaseClient.from("profiles").select("full_name, email").eq("id", vendor_id).single(),
    ]);

    if (!contract || !vendor) throw new Error("Contract or vendor not found");

    const emailResponse = await resend.emails.send({
      from: "Monarch Property Management <noreply@monarchpropertymmgt.com>",
      to: [vendor.email],
      subject: `🎉 Contract Awarded: ${contract.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C2C2C; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .trophy { font-size: 64px; margin-bottom: 10px; }
              .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
              .details { background: #FEF3C7; padding: 20px; border-left: 4px solid #D4AF37; margin: 20px 0; border-radius: 4px; }
              .contract-value { font-size: 32px; font-weight: bold; color: #D4AF37; text-align: center; margin: 20px 0; }
              .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="trophy">🏆</div>
                <h1 style="margin: 0;">Congratulations!</h1>
                <h2 style="margin: 10px 0 0 0; font-weight: normal;">Contract Awarded</h2>
              </div>
              <div class="content">
                <p>Dear ${vendor.full_name},</p>
                
                <p><strong>Great news!</strong> We are pleased to inform you that your bid has been selected, and the contract has been awarded to you.</p>
                
                <div class="contract-value">
                  Contract Value: $${contract.contract_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                <div class="details">
                  <h3 style="margin-top: 0; color: #D4AF37;">Contract Details</h3>
                  <p><strong>Contract Number:</strong> ${contract.contract_number}</p>
                  <p><strong>Project:</strong> ${contract.title}</p>
                  <p><strong>Start Date:</strong> ${new Date(contract.start_date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                  <p><strong>End Date:</strong> ${new Date(contract.end_date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Review the full contract details in your vendor portal</li>
                  <li>Sign the contract electronically within 5 business days</li>
                  <li>Submit required insurance certificates and bonds</li>
                  <li>Schedule a kick-off meeting with our project manager</li>
                </ol>
                
                <center>
                  <a href="https://monarchpropertymmgt.com/vendor/contracts/${contract_id}" class="button">View Contract Details</a>
                </center>
                
                <p style="margin-top: 30px;">We look forward to a successful partnership with you on this project. If you have any questions, please don't hesitate to reach out to our team.</p>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">Thank you for choosing to work with Monarch Property Management.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Monarch Property Management. All rights reserved.</p>
                <p>This is an official contract award notification.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`Award email sent to ${vendor.email}:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contract-award function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
