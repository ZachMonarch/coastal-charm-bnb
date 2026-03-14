// Shared email header and footer for consistent Monarch branding across all email templates

export const BRAND_COLORS = {
  gold: '#D4AF37',
  goldDark: '#B8941F',
  goldLight: '#E8C547',
  charcoal: '#2C2C2C',
  offWhite: '#FAF9F6',
  white: '#FFFFFF',
  gray: '#6B7280',
  grayLight: '#F9FAFB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
};

export const LOGO_URL = 'https://monarchpropertymmgt.online/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png';
export const SITE_URL = 'https://monarchpropertymmgt.online';

// Common email styles
export const emailStyles = `
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.6; 
    color: ${BRAND_COLORS.charcoal}; 
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .email-wrapper {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header { 
    background: linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldDark} 100%); 
    color: white; 
    padding: 30px 40px; 
    text-align: center; 
    border-radius: 8px 8px 0 0; 
  }
  .header-logo {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }
  .header-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .header-subtitle {
    margin: 8px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
    font-weight: normal;
  }
  .content { 
    background: ${BRAND_COLORS.white}; 
    padding: 35px 40px; 
    border: 1px solid #E5E7EB; 
    border-top: none;
  }
  .content p {
    margin: 0 0 16px 0;
  }
  .greeting {
    font-size: 16px;
    margin-bottom: 20px;
  }
  .button { 
    display: inline-block; 
    background: ${BRAND_COLORS.gold}; 
    color: ${BRAND_COLORS.white} !important; 
    padding: 14px 32px; 
    text-decoration: none; 
    border-radius: 6px; 
    font-weight: 600;
    font-size: 15px;
    margin: 20px 0;
    transition: background 0.2s;
  }
  .button:hover {
    background: ${BRAND_COLORS.goldDark};
  }
  .details-box { 
    background: ${BRAND_COLORS.grayLight}; 
    padding: 20px; 
    border-left: 4px solid ${BRAND_COLORS.gold}; 
    margin: 24px 0; 
    border-radius: 0 6px 6px 0;
  }
  .details-box h3 {
    margin: 0 0 12px 0;
    color: ${BRAND_COLORS.gold};
    font-size: 16px;
  }
  .details-box p {
    margin: 8px 0;
    font-size: 14px;
  }
  .amount-highlight {
    font-size: 28px;
    font-weight: bold;
    color: ${BRAND_COLORS.gold};
    text-align: center;
    margin: 24px 0;
    padding: 20px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(184, 148, 31, 0.1) 100%);
    border-radius: 8px;
  }
  .footer { 
    background: ${BRAND_COLORS.grayLight};
    text-align: center; 
    padding: 25px 40px;
    border: 1px solid #E5E7EB;
    border-top: none;
    border-radius: 0 0 8px 8px;
  }
  .footer p {
    margin: 0;
    color: ${BRAND_COLORS.gray}; 
    font-size: 13px;
  }
  .footer-links {
    margin-top: 12px;
  }
  .footer-links a {
    color: ${BRAND_COLORS.gray};
    text-decoration: none;
    margin: 0 10px;
    font-size: 12px;
  }
  .footer-links a:hover {
    color: ${BRAND_COLORS.gold};
  }
  .divider {
    height: 1px;
    background: #E5E7EB;
    margin: 24px 0;
  }
  .success-badge {
    display: inline-block;
    background: ${BRAND_COLORS.success};
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 15px;
  }
  .warning-badge {
    display: inline-block;
    background: ${BRAND_COLORS.warning};
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 15px;
  }
  ul, ol {
    margin: 16px 0;
    padding-left: 24px;
  }
  li {
    margin: 8px 0;
  }
`;

// Generate standard email header with logo
export function generateEmailHeader(title: string, subtitle?: string): string {
  return `
    <div class="header">
      <img src="${LOGO_URL}" alt="Monarch Property Management" class="header-logo" />
      <h1 class="header-title">${title}</h1>
      ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
}

// Generate standard email footer
export function generateEmailFooter(): string {
  const year = new Date().getFullYear();
  return `
    <div class="footer">
      <p>© ${year} Monarch Property Management. All rights reserved.</p>
      <div class="footer-links">
        <a href="${SITE_URL}/privacy">Privacy Policy</a>
        <a href="${SITE_URL}/terms">Terms of Service</a>
        <a href="${SITE_URL}/contact">Contact Us</a>
      </div>
      <p style="margin-top: 12px; font-size: 11px; color: #9CA3AF;">
        123 Property Lane, Suite 100, Your City, ST 12345
      </p>
    </div>
  `;
}

// Generate complete email wrapper
export function wrapEmailContent(headerTitle: string, headerSubtitle: string | undefined, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerTitle}</title>
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="email-wrapper">
        ${generateEmailHeader(headerTitle, headerSubtitle)}
        <div class="content">
          ${bodyContent}
        </div>
        ${generateEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

// Format currency consistently
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date consistently
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'long',
    timeStyle: 'short',
  };
  return new Date(dateString).toLocaleString('en-US', options || defaultOptions);
}

// Sanitize user input for email display
export function sanitizeForEmail(input: string | undefined | null): string {
  if (!input) return '';
  return input.replace(/[<>]/g, '').trim();
}
