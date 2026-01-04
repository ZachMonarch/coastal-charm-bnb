/**
 * Centralized Email Configuration for Monarch Property Management
 * 
 * All email sender addresses, anti-spam headers, and configuration
 * should be defined here for consistency across all edge functions.
 */

export const EMAIL_CONFIG = {
  // Production domain - verified in Resend
  domain: "monarchpropertymmgt.com",
  
  // Sender addresses by purpose
  senders: {
    noreply: "Monarch Property Management <noreply@monarchpropertymmgt.com>",
    welcome: "Monarch Property Management <welcome@monarchpropertymmgt.com>",
    newsletter: "Monarch Property News <newsletter@monarchpropertymmgt.com>",
    notifications: "Monarch Property Management <notifications@monarchpropertymmgt.com>",
    invoices: "Monarch Invoicing <invoices@monarchpropertymmgt.com>",
    payouts: "Monarch Property Management <payouts@monarchpropertymmgt.com>",
    support: "Monarch Support <support@monarchpropertymmgt.com>",
  },
  
  // Reply-to address for user responses
  replyTo: "support@monarchpropertymmgt.com",
  
  // URLs
  siteUrl: "https://monarchpropertymmgt.com",
  unsubscribeUrl: "https://monarchpropertymmgt.com/settings/notifications",
  privacyUrl: "https://monarchpropertymmgt.com/privacy",
  termsUrl: "https://monarchpropertymmgt.com/terms",
  
  // Company info for footers
  company: {
    name: "Monarch Property Management",
    phone1: "(304) 365-8349",
    phone2: "(614) 427-8576",
    email: "support@monarchpropertymmgt.com",
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
