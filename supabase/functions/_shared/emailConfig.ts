/**
 * Centralized Email Configuration for Monarch Property Management
 * 
 * All email sender addresses, anti-spam headers, and configuration
 * should be defined here for consistency across all edge functions.
 */

export const EMAIL_CONFIG = {
  // Production domain - verified in Resend
  domain: "monarchpropertymmgt.online",
  
  // Sender addresses by purpose
  senders: {
    noreply: "Monarch Property Management <noreply@monarchpropertymmgt.online>",
    welcome: "Monarch Property Management <welcome@monarchpropertymmgt.online>",
    newsletter: "Monarch Property News <newsletter@monarchpropertymmgt.online>",
    notifications: "Monarch Property Management <notifications@monarchpropertymmgt.online>",
    invoices: "Monarch Invoicing <invoices@monarchpropertymmgt.online>",
    payouts: "Monarch Property Management <payouts@monarchpropertymmgt.online>",
    support: "Monarch Support <support@monarchpropertymmgt.online>",
  },
  
  // Reply-to address for user responses
  replyTo: "support@monarchpropertymmgt.online",
  
  // URLs
  siteUrl: "https://monarchpropertymmgt.online",
  unsubscribeUrl: "https://monarchpropertymmgt.online/settings/notifications",
  privacyUrl: "https://monarchpropertymmgt.online/privacy",
  termsUrl: "https://monarchpropertymmgt.online/terms",
  
  // Company info for footers
  company: {
    name: "Monarch Property Management",
    phone1: "(304) 365-8349",
    phone2: "(614) 427-8576",
    email: "support@monarchpropertymmgt.online",
    address: "United States",
  }
};

/**
 * Generate anti-spam headers for improved email deliverability
 * These headers help emails avoid spam filters and comply with Gmail/Yahoo requirements
 */
export function getAntiSpamHeaders(options: {
  emailId?: string;
  listUnsubscribeUrl?: string;
  category?: string;
}): Record<string, string> {
  const { emailId, listUnsubscribeUrl, category } = options;
  
  return {
    // Unique identifier for tracking/deduplication
    "X-Entity-Ref-ID": emailId || `monarch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    // List-Unsubscribe header (required by Gmail/Yahoo for bulk senders)
    "List-Unsubscribe": `<${listUnsubscribeUrl || EMAIL_CONFIG.unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    
    // Category for filtering
    ...(category && { "X-Email-Category": category }),
    
    // Feedback ID for reputation tracking
    "Feedback-ID": `${category || 'transactional'}:monarch:${EMAIL_CONFIG.domain}`,
  };
}

/**
 * Get Resend email options with anti-spam headers
 */
export function getEmailOptions(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  category?: string;
  emailId?: string;
}) {
  const headers = getAntiSpamHeaders({
    emailId: options.emailId,
    category: options.category,
  });
  
  return {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    reply_to: options.replyTo || EMAIL_CONFIG.replyTo,
    headers,
  };
}

/**
 * Validate that sender email matches our verified domain
 */
export function validateSenderDomain(fromAddress: string): boolean {
  return fromAddress.includes(`@${EMAIL_CONFIG.domain}`);
}
