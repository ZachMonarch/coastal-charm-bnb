-- Add missing email templates for all critical flows
INSERT INTO email_templates (name, subject, html_content, text_content, variables, is_active) VALUES
-- Welcome email
('welcome_email', 'Welcome to Monarch Property Management', 
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #D4AF37; margin: 0;">Welcome to Monarch Property Management</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{name}},</p>
<p style="color: #333; font-size: 16px;">Thank you for joining Monarch Property Management. Your account has been successfully created.</p>
<p style="color: #333; font-size: 16px;">Get started by visiting your dashboard:</p>
<a href="{{dashboard_url}}" style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
</div>
<div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
<p>© 2025 Monarch Property Management. All rights reserved.</p>
</div>
</body></html>',
'Hello {{name}}, Welcome to Monarch Property Management. Visit your dashboard: {{dashboard_url}}',
'{"name": "string", "dashboard_url": "string"}'::jsonb, true),

-- Password reset
('password_reset', 'Reset Your Password - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #D4AF37; margin: 0;">Password Reset Request</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello,</p>
<p style="color: #333; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
<a href="{{reset_url}}" style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
<p style="color: #666; font-size: 14px; margin-top: 20px;">If you did not request this reset, please ignore this email. This link expires in 24 hours.</p>
</div>
</body></html>',
'Password reset link: {{reset_url}}. If you did not request this, please ignore.',
'{"reset_url": "string"}'::jsonb, true),

-- Bid confirmation
('bid_confirmation', 'Bid Submitted Successfully - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #D4AF37; margin: 0;">Bid Submitted</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{vendor_name}},</p>
<p style="color: #333; font-size: 16px;">Your bid for <strong>{{rfq_title}}</strong> has been successfully submitted.</p>
<div style="background: #fff; padding: 20px; border-radius: 5px; border-left: 4px solid #D4AF37;">
<p style="margin: 0;"><strong>Bid Amount:</strong> ${{bid_amount}}</p>
<p style="margin: 10px 0 0;"><strong>Deadline:</strong> {{deadline}}</p>
</div>
<p style="color: #333; font-size: 16px;">We will notify you once the bid has been reviewed.</p>
<a href="{{rfq_url}}" style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View RFQ Details</a>
</div>
</body></html>',
'Your bid for {{rfq_title}} (${{bid_amount}}) has been submitted. View: {{rfq_url}}',
'{"vendor_name": "string", "rfq_title": "string", "bid_amount": "number", "deadline": "string", "rfq_url": "string"}'::jsonb, true),

-- Contract award
('contract_award', 'Congratulations! Contract Awarded - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #D4AF37; margin: 0;">🎉 Contract Awarded!</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Congratulations {{vendor_name}},</p>
<p style="color: #333; font-size: 16px;">You have been awarded the contract for <strong>{{contract_title}}</strong>.</p>
<div style="background: #fff; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
<p style="margin: 0;"><strong>Contract Value:</strong> ${{contract_value}}</p>
<p style="margin: 10px 0 0;"><strong>Start Date:</strong> {{start_date}}</p>
<p style="margin: 10px 0 0;"><strong>End Date:</strong> {{end_date}}</p>
</div>
<a href="{{contract_url}}" style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">View Contract</a>
</div>
</body></html>',
'Congratulations! You have been awarded {{contract_title}}. Value: ${{contract_value}}. View: {{contract_url}}',
'{"vendor_name": "string", "contract_title": "string", "contract_value": "number", "start_date": "string", "end_date": "string", "contract_url": "string"}'::jsonb, true),

-- RFQ invitation
('rfq_invitation', 'New RFQ Opportunity - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #D4AF37; margin: 0;">New RFQ Invitation</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{vendor_name}},</p>
<p style="color: #333; font-size: 16px;">You have been invited to submit a bid for:</p>
<div style="background: #fff; padding: 20px; border-radius: 5px; border-left: 4px solid #D4AF37;">
<h2 style="color: #1a1a2e; margin: 0;">{{rfq_title}}</h2>
<p style="color: #666; margin: 10px 0;">{{rfq_description}}</p>
<p style="margin: 10px 0 0;"><strong>Deadline:</strong> {{deadline}}</p>
<p style="margin: 10px 0 0;"><strong>Budget Range:</strong> ${{budget_min}} - ${{budget_max}}</p>
</div>
<a href="{{rfq_url}}" style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">View RFQ & Submit Bid</a>
</div>
</body></html>',
'New RFQ: {{rfq_title}}. Deadline: {{deadline}}. Submit bid: {{rfq_url}}',
'{"vendor_name": "string", "rfq_title": "string", "rfq_description": "string", "deadline": "string", "budget_min": "number", "budget_max": "number", "rfq_url": "string"}'::jsonb, true),

-- RFQ reminder
('rfq_reminder', 'RFQ Deadline Approaching - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #fff; margin: 0;">⏰ Deadline Reminder</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{vendor_name}},</p>
<p style="color: #333; font-size: 16px;">The deadline for <strong>{{rfq_title}}</strong> is approaching!</p>
<div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
<p style="margin: 0; color: #856404;"><strong>Deadline: {{deadline}}</strong></p>
<p style="margin: 5px 0 0; color: #856404;">Time remaining: {{time_remaining}}</p>
</div>
<a href="{{rfq_url}}" style="display: inline-block; background: #dc3545; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Submit Bid Now</a>
</div>
</body></html>',
'REMINDER: {{rfq_title}} deadline is {{deadline}}. Submit now: {{rfq_url}}',
'{"vendor_name": "string", "rfq_title": "string", "deadline": "string", "time_remaining": "string", "rfq_url": "string"}'::jsonb, true),

-- Payment notification
('payment_notification', 'Payment Required - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #D4AF37; margin: 0;">Payment Required</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{user_name}},</p>
<p style="color: #333; font-size: 16px;">A payment is due for your account:</p>
<div style="background: #fff; padding: 20px; border-radius: 5px; border-left: 4px solid #D4AF37;">
<p style="margin: 0;"><strong>{{payment_title}}</strong></p>
<p style="margin: 10px 0 0;"><strong>Amount:</strong> ${{amount}}</p>
<p style="margin: 10px 0 0;"><strong>Due Date:</strong> {{due_date}}</p>
</div>
<a href="{{payment_url}}" style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Pay Now</a>
</div>
</body></html>',
'Payment due: {{payment_title}} - ${{amount}}. Due: {{due_date}}. Pay: {{payment_url}}',
'{"user_name": "string", "payment_title": "string", "amount": "number", "due_date": "string", "payment_url": "string"}'::jsonb, true),

-- Compliance expiry warning
('compliance_expiry_warning', 'Document Expiring Soon - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #1a1a2e; margin: 0;">⚠️ Document Expiring Soon</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{vendor_name}},</p>
<p style="color: #333; font-size: 16px;">The following document is expiring soon:</p>
<div style="background: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
<p style="margin: 0;"><strong>{{document_name}}</strong></p>
<p style="margin: 10px 0 0;"><strong>Expires:</strong> {{expiry_date}}</p>
<p style="margin: 10px 0 0;"><strong>Days Remaining:</strong> {{days_remaining}}</p>
</div>
<p style="color: #333; font-size: 16px;">Please upload a renewed document to maintain your verified status.</p>
<a href="{{documents_url}}" style="display: inline-block; background: #ffc107; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Upload Document</a>
</div>
</body></html>',
'Document {{document_name}} expires on {{expiry_date}} ({{days_remaining}} days). Update: {{documents_url}}',
'{"vendor_name": "string", "document_name": "string", "expiry_date": "string", "days_remaining": "number", "documents_url": "string"}'::jsonb, true),

-- Access request approved
('access_request_approved', 'Access Request Approved - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #fff; margin: 0;">✅ Access Approved!</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{user_name}},</p>
<p style="color: #333; font-size: 16px;">Great news! Your access request has been approved.</p>
<div style="background: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
<p style="margin: 0;"><strong>Role Granted:</strong> {{role}}</p>
</div>
<p style="color: #333; font-size: 16px;">You now have full access to all {{role}} features.</p>
<a href="{{dashboard_url}}" style="display: inline-block; background: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Go to Dashboard</a>
</div>
</body></html>',
'Your access request for {{role}} has been approved! Visit: {{dashboard_url}}',
'{"user_name": "string", "role": "string", "dashboard_url": "string"}'::jsonb, true),

-- Access request rejected
('access_request_rejected', 'Access Request Update - Monarch Property Management',
'<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #6c757d 0%, #545b62 100%); padding: 30px; border-radius: 10px;">
<h1 style="color: #fff; margin: 0;">Access Request Update</h1>
</div>
<div style="padding: 30px; background: #f8f9fa;">
<p style="color: #333; font-size: 16px;">Hello {{user_name}},</p>
<p style="color: #333; font-size: 16px;">We have reviewed your access request for {{role}}.</p>
<div style="background: #f8d7da; padding: 20px; border-radius: 5px; border-left: 4px solid #dc3545;">
<p style="margin: 0;"><strong>Status:</strong> Not Approved</p>
<p style="margin: 10px 0 0;"><strong>Reason:</strong> {{reason}}</p>
</div>
<p style="color: #333; font-size: 16px;">If you have questions, please contact our support team.</p>
<a href="{{contact_url}}" style="display: inline-block; background: #6c757d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Contact Support</a>
</div>
</body></html>',
'Your access request for {{role}} was not approved. Reason: {{reason}}. Contact: {{contact_url}}',
'{"user_name": "string", "role": "string", "reason": "string", "contact_url": "string"}'::jsonb, true)

ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();