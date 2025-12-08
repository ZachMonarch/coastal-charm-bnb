import jsPDF from 'jspdf';
import { VendorInvoice } from '@/hooks/useVendorInvoicing';

export const generateInvoicePDF = async (invoice: VendorInvoice) => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let currentY = margin;

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 6;
    pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - margin, currentY, { align: 'right' });
    
    if (invoice.due_date) {
      currentY += 6;
      pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, pageWidth - margin, currentY, { align: 'right' });
    }

    // Company/Vendor Info (Left side)
    currentY = margin + 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', margin, currentY);
    
    currentY += 8;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Vendor Services', margin, currentY);
    currentY += 6;
    pdf.text('vendor@example.com', margin, currentY);

    // Client Info
    currentY += 20;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', margin, currentY);
    
    currentY += 8;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.client_name, margin, currentY);
    currentY += 6;
    pdf.text(invoice.client_email, margin, currentY);

    // Project/Milestone Info
    currentY += 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Project Details:', margin, currentY);
    
    currentY += 8;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Project: ${invoice.project?.title || 'Unknown Project'}`, margin, currentY);
    
    if (invoice.milestone) {
      currentY += 6;
      pdf.text(`Milestone: ${invoice.milestone.name}`, margin, currentY);
    }

    // Line Items Table
    currentY += 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Items:', margin, currentY);

    // Table Header
    currentY += 12;
    const tableStartY = currentY;
    const colWidths = [100, 30, 30, 30];
    const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', colPositions[0], currentY);
    pdf.text('Qty', colPositions[1], currentY);
    pdf.text('Rate', colPositions[2], currentY);
    pdf.text('Total', colPositions[3], currentY);

    // Table line
    currentY += 2;
    pdf.line(margin, currentY, pageWidth - margin, currentY);

    // Line Items
    currentY += 8;
    pdf.setFont('helvetica', 'normal');
    
    if (invoice.line_items && invoice.line_items.length > 0) {
      invoice.line_items.forEach((item) => {
        pdf.text(item.description || invoice.description || 'Service', colPositions[0], currentY);
        pdf.text(String(item.quantity || 1), colPositions[1], currentY);
        pdf.text(`$${Number(item.unit_price || invoice.amount).toFixed(2)}`, colPositions[2], currentY);
        pdf.text(`$${Number(item.total || invoice.amount).toFixed(2)}`, colPositions[3], currentY);
        currentY += 6;
      });
    } else {
      // Default single line item
      pdf.text(invoice.description || 'Professional Services', colPositions[0], currentY);
      pdf.text('1', colPositions[1], currentY);
      pdf.text(`$${Number(invoice.amount).toFixed(2)}`, colPositions[2], currentY);
      pdf.text(`$${Number(invoice.amount).toFixed(2)}`, colPositions[3], currentY);
      currentY += 6;
    }

    // Total Section
    currentY += 10;
    pdf.line(colPositions[2], currentY, pageWidth - margin, currentY);
    
    currentY += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subtotal:', colPositions[2], currentY);
    pdf.text(`$${Number(invoice.amount).toFixed(2)}`, colPositions[3], currentY);

    currentY += 6;
    pdf.text('Total:', colPositions[2], currentY);
    pdf.text(`$${Number(invoice.amount).toFixed(2)}`, colPositions[3], currentY);

    // Status
    currentY += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Status: ${invoice.status.toUpperCase()}`, margin, currentY);

    // Payment Terms
    currentY += 15;
    pdf.setFontSize(10);
    pdf.text('Payment Terms: Net 30 days', margin, currentY);
    currentY += 5;
    pdf.text('Thank you for your business!', margin, currentY);

    // Save the PDF
    const fileName = `invoice-${invoice.invoice_number}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};