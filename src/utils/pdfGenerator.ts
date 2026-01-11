import html2pdf from 'html2pdf.js';
import { VendorInvoice } from '@/hooks/useVendorInvoicing';

/**
 * Generate a PDF invoice from invoice data using html2pdf.js
 * This replaces the vulnerable jspdf library
 */
export const generateInvoicePDF = async (invoice: VendorInvoice) => {
  try {
    // Create the HTML content for the invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; color: #1a1a1a; }
          .invoice-info { text-align: right; }
          .invoice-info p { margin: 4px 0; font-size: 12px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #666; }
          .client-info p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f5f5f5; text-align: left; padding: 10px; font-size: 11px; border-bottom: 2px solid #ddd; }
          td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
          .total-row { font-weight: bold; background: #f9f9f9; }
          .amount { text-align: right; }
          .status { margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px; }
          .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">INVOICE</div>
          <div class="invoice-info">
            <p><strong>Invoice #:</strong> ${escapeHtml(invoice.invoice_number)}</p>
            <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
            ${invoice.due_date ? `<p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">From:</div>
          <p>Vendor Services</p>
          <p>vendor@example.com</p>
        </div>
        
        <div class="section client-info">
          <div class="section-title">Bill To:</div>
          <p><strong>${escapeHtml(invoice.client_name)}</strong></p>
          <p>${escapeHtml(invoice.client_email)}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Project Details:</div>
          <p><strong>Project:</strong> ${escapeHtml(invoice.project?.title || 'Unknown Project')}</p>
          ${invoice.milestone ? `<p><strong>Milestone:</strong> ${escapeHtml(invoice.milestone.name)}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
            ${generateLineItemsHtml(invoice)}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3">Subtotal</td>
              <td class="amount">$${Number(invoice.amount).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3"><strong>Total</strong></td>
              <td class="amount"><strong>$${Number(invoice.amount).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="status">
          <strong>Status:</strong> ${escapeHtml(invoice.status.toUpperCase())}
        </div>
        
        <div class="footer">
          <p>Payment Terms: Net 30 days</p>
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Generate PDF
    const opt = {
      margin: 10,
      filename: `invoice-${invoice.invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(container).save();

    // Clean up
    document.body.removeChild(container);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Escape HTML to prevent XSS in PDF generation
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate HTML for line items
 */
function generateLineItemsHtml(invoice: VendorInvoice): string {
  if (invoice.line_items && invoice.line_items.length > 0) {
    return invoice.line_items.map((item) => `
      <tr>
        <td>${escapeHtml(item.description || invoice.description || 'Service')}</td>
        <td>${item.quantity || 1}</td>
        <td>$${Number(item.unit_price || invoice.amount).toFixed(2)}</td>
        <td class="amount">$${Number(item.total || invoice.amount).toFixed(2)}</td>
      </tr>
    `).join('');
  }
  
  // Default single line item
  return `
    <tr>
      <td>${escapeHtml(invoice.description || 'Professional Services')}</td>
      <td>1</td>
      <td>$${Number(invoice.amount).toFixed(2)}</td>
      <td class="amount">$${Number(invoice.amount).toFixed(2)}</td>
    </tr>
  `;
}
