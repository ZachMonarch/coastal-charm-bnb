import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { EMAIL_CONFIG, getAntiSpamHeaders } from "../_shared/emailConfig.ts";

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const BRAND_COLORS = {
  gold: '#D4AF37',
  charcoal: '#36454F',
  offWhite: '#FAF9F6',
};

interface InvoiceEmailRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  projectTitle?: string;
  description?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  vendorName?: string;
  vendorCompany?: string;
  paymentUrl?: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    if (!resend || !RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body: InvoiceEmailRequest = await req.json();
    const {
      invoiceId,
      recipientEmail,
      recipientName,
      invoiceNumber,
      amount,
      currency = 'USD',
      dueDate,
      projectTitle,
      description,
      lineItems = [],
      vendorName,
      vendorCompany,
      paymentUrl,
    } = body;

    // Validate required fields
    if (!invoiceId || !recipientEmail || !invoiceNumber || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: invoiceId, recipientEmail, invoiceNumber, amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Format currency
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);

    // Format due date
    const formattedDueDate = dueDate 
      ? new Date(dueDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Upon Receipt';

    // Generate line items HTML
    let lineItemsHtml = '';
    if (lineItems.length > 0) {
      lineItemsHtml = lineItems.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.total.toFixed(2)}</td>
        </tr>
      `).join('');
    } else {
      lineItemsHtml = `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${description || projectTitle || 'Services Rendered'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">1</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formattedAmount}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formattedAmount}</td>
        </tr>
      `;
    }

    // Generate anti-spam headers
    const emailId = `invoice-${invoiceNumber}-${Date.now()}`;
    const antiSpamHeaders = getAntiSpamHeaders({
      emailId,
      category: 'invoice',
    });

    // Generate email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${BRAND_COLORS.charcoal} 0%, #4a5568 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: ${BRAND_COLORS.gold}; margin: 0; font-size: 28px; font-weight: 600;">INVOICE</h1>
            <p style="color: ${BRAND_COLORS.offWhite}; margin: 10px 0 0 0; font-size: 16px;">${invoiceNumber}</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: ${BRAND_COLORS.charcoal}; font-size: 16px; margin: 0 0 20px 0;">
              Dear ${recipientName || 'Valued Client'},
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 25px 0;">
              Please find attached your invoice from ${vendorCompany || vendorName || 'Monarch Property Management'}. 
              Below is a summary of the charges.
            </p>
            
            <!-- Invoice Details Box -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Invoice Number:</span>
                <span style="color: ${BRAND_COLORS.charcoal}; font-weight: 600;">${invoiceNumber}</span>
              </div>
              ${projectTitle ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Project:</span>
                <span style="color: ${BRAND_COLORS.charcoal}; font-weight: 600;">${projectTitle}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                <span style="color: ${BRAND_COLORS.charcoal}; font-weight: 600;">${formattedDueDate}</span>
              </div>
              <div style="border-top: 2px solid ${BRAND_COLORS.gold}; margin-top: 15px; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${BRAND_COLORS.charcoal}; font-size: 18px; font-weight: 600;">Amount Due:</span>
                  <span style="color: ${BRAND_COLORS.gold}; font-size: 24px; font-weight: 700;">${formattedAmount}</span>
                </div>
              </div>
            </div>
            
            <!-- Line Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="background-color: ${BRAND_COLORS.charcoal};">
                  <th style="padding: 12px; color: white; text-align: left; font-size: 12px; text-transform: uppercase;">Description</th>
                  <th style="padding: 12px; color: white; text-align: center; font-size: 12px; text-transform: uppercase;">Qty</th>
                  <th style="padding: 12px; color: white; text-align: right; font-size: 12px; text-transform: uppercase;">Unit Price</th>
                  <th style="padding: 12px; color: white; text-align: right; font-size: 12px; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineItemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: ${BRAND_COLORS.charcoal};">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: 700; color: ${BRAND_COLORS.gold}; font-size: 18px;">${formattedAmount}</td>
                </tr>
              </tfoot>
            </table>
            
            ${paymentUrl ? `
            <!-- Payment Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, #c9a227 100%); color: ${BRAND_COLORS.charcoal}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">
                Pay Now
              </a>
            </div>
            ` : ''}
            
            <!-- Footer Note -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                <strong>Payment Terms:</strong> Payment is due ${formattedDueDate}. Please reference invoice number ${invoiceNumber} when making payment.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                If you have any questions regarding this invoice, please contact us at ${EMAIL_CONFIG.company.email}
              </p>
            </div>
            
            <p style="color: ${BRAND_COLORS.charcoal}; font-size: 14px; margin: 25px 0 0 0;">
              Thank you for your business!<br>
              <strong>${vendorCompany || vendorName || EMAIL_CONFIG.company.name}</strong>
            </p>
          </div>
          
          <!-- Email Footer -->
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">${EMAIL_CONFIG.company.name}</p>
            <p style="margin: 5px 0 0 0;">This is an automated invoice notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: EMAIL_CONFIG.senders.invoices,
      to: [recipientEmail],
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `Invoice ${invoiceNumber} - ${formattedAmount} Due`,
      html: emailHtml,
      headers: antiSpamHeaders,
    });

    console.log('Invoice email sent successfully:', emailResponse);

    // Update invoice status to 'sent'
    const { error: updateError } = await supabaseClient
      .from('invoices')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.warn('Failed to update invoice status:', updateError);
    }

    // Log audit event
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'INVOICE_EMAIL_SENT',
      table_name: 'invoices',
      record_id: invoiceId,
      new_values: {
        invoice_number: invoiceNumber,
        recipient_email: recipientEmail,
        amount: amount,
        sent_at: new Date().toISOString()
      }
    });

    // Create notification for recipient if they have an account
    const { data: recipientProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', recipientEmail)
      .single();

    if (recipientProfile) {
      await supabaseClient.from('notifications').insert({
        user_id: recipientProfile.id,
        title: 'New Invoice Received',
        message: `Invoice ${invoiceNumber} for ${formattedAmount} is now due.`,
        type: 'info',
        action_url: paymentUrl || '/payments'
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        invoiceNumber,
        recipientEmail 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error('Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send invoice email' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
