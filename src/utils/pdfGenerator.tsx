import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { VendorInvoice } from '@/hooks/useVendorInvoicing';

/**
 * PDF styles for invoice document
 * Using @react-pdf/renderer - secure alternative to vulnerable jspdf/html2pdf
 */
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  infoText: {
    fontSize: 10,
    marginBottom: 2,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  clientName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  table: {
    marginVertical: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 8,
    fontWeight: 'bold',
  },
  colDescription: {
    width: '50%',
  },
  colQty: {
    width: '15%',
  },
  colRate: {
    width: '15%',
  },
  colTotal: {
    width: '20%',
    textAlign: 'right',
  },
  status: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  footer: {
    marginTop: 25,
    fontSize: 9,
    color: '#888',
    textAlign: 'center',
  },
});

/**
 * Sanitize text to prevent injection attacks
 * Removes potentially dangerous characters and limits length
 */
function sanitizeText(text: string | undefined | null, maxLength: number = 500): string {
  if (!text) return '';
  // Remove control characters and limit length
  return String(text)
    .replace(/[\x00-\x1f\x7f]/g, '')
    .slice(0, maxLength);
}

/**
 * Format currency safely
 */
function formatCurrency(amount: number | string | undefined): string {
  const num = Number(amount) || 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Invoice PDF Document Component
 */
const InvoiceDocument = ({ invoice }: { invoice: VendorInvoice }) => {
  const lineItems = invoice.line_items && invoice.line_items.length > 0
    ? invoice.line_items
    : [{ 
        description: invoice.description || 'Professional Services', 
        quantity: 1, 
        unit_price: invoice.amount, 
        total: invoice.amount 
      }];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <View style={styles.invoiceInfo}>
            <Text style={styles.infoText}>
              Invoice #: {sanitizeText(invoice.invoice_number, 50)}
            </Text>
            <Text style={styles.infoText}>
              Date: {new Date(invoice.created_at).toLocaleDateString()}
            </Text>
            {invoice.due_date && (
              <Text style={styles.infoText}>
                Due Date: {new Date(invoice.due_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From:</Text>
          <Text>Vendor Services</Text>
          <Text>vendor@example.com</Text>
        </View>

        {/* Bill To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={styles.clientName}>{sanitizeText(invoice.client_name, 100)}</Text>
          <Text>{sanitizeText(invoice.client_email, 100)}</Text>
        </View>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details:</Text>
          <Text>Project: {sanitizeText(invoice.project?.title || 'Unknown Project', 200)}</Text>
          {invoice.milestone && (
            <Text>Milestone: {sanitizeText(invoice.milestone.name, 200)}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {/* Table Rows */}
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>
                {sanitizeText(item.description || invoice.description || 'Service', 200)}
              </Text>
              <Text style={styles.colQty}>{item.quantity || 1}</Text>
              <Text style={styles.colRate}>{formatCurrency(item.unit_price || invoice.amount)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total || invoice.amount)}</Text>
            </View>
          ))}

          {/* Subtotal Row */}
          <View style={styles.totalRow}>
            <Text style={styles.colDescription}>Subtotal</Text>
            <Text style={styles.colQty}></Text>
            <Text style={styles.colRate}></Text>
            <Text style={styles.colTotal}>{formatCurrency(invoice.amount)}</Text>
          </View>

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={[styles.colDescription, { fontWeight: 'bold' }]}>Total</Text>
            <Text style={styles.colQty}></Text>
            <Text style={styles.colRate}></Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{formatCurrency(invoice.amount)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.status}>
          <Text>Status: {sanitizeText(invoice.status?.toUpperCase(), 20)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Payment Terms: Net 30 days</Text>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate a PDF invoice from invoice data using @react-pdf/renderer
 * This is a secure alternative that doesn't use the vulnerable jspdf library
 */
export const generateInvoicePDF = async (invoice: VendorInvoice): Promise<boolean> => {
  try {
    // Generate PDF blob
    const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${sanitizeText(invoice.invoice_number, 50)}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Generate PDF blob without downloading (for email attachments, etc.)
 */
export const generateInvoicePDFBlob = async (invoice: VendorInvoice): Promise<Blob> => {
  try {
    return await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw new Error('Failed to generate PDF');
  }
};
