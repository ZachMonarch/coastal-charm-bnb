

# MONARCH PROPERTY MANAGEMENT -- REBUILD-READY SYSTEM BLUEPRINT

**Document Version**: 1.0
**Extraction Date**: 2026-02-23
**Source Domain**: monarchpropertymmgt.com
**Supabase Project ID**: yhegaaqxmuhszesbjtdo
**PostgreSQL Version**: 17.4

---

## 1. SYSTEM OVERVIEW

### Purpose
Monarch Property Management is a multi-tenant SaaS web application for professional property management companies. It manages the full lifecycle of property operations: property listings, tenant management, vendor procurement (via RFQ/RFP), project management, payments, and internal communications.

### Target Users
- **Property management companies** (primary operator/tenant)
- **Service vendors** (plumbers, electricians, contractors, etc.)
- **Tenants/residents** (property occupants)
- **Administrative staff** (internal operations)

### Core Value Proposition
A single platform that connects property managers with vetted vendors through a competitive bidding system (RFQ), manages maintenance projects from request to completion, handles vendor payments/payouts, and provides tenant-facing property booking/inquiry features.

### Operational Scope
Multi-tenant architecture. Each organizational tenant has isolated data via `tenant_id` foreign keys and tenant-scoped RLS policies. Designed for mid-to-enterprise property management firms managing multiple properties, vendors, and tenants simultaneously.

---

## 2. USER ROLES AND PERMISSIONS MATRIX

### Role Definitions

| Role | Description | Priority |
|------|-------------|----------|
| `admin` | Full system access. Manages users, vendors, projects, payments, security. Protected admins cannot have role removed. | 1 (highest) |
| `property_manager` | Manages properties, tenants, projects. Can view reports, manage vendors. Cannot manage users or payments directly. | 2 |
| `vendor` | External service provider. Can bid on projects, manage own profile/documents, view assigned projects, submit invoices. | 3 |
| `tenant` | Property occupant. Can view leases, submit maintenance tickets, make bookings. | 4 (lowest) |
| `property_owner` | Defined in enum but not actively used in routing. INFERRED: reserved for future use. | N/A |

### Permission Matrix

| Feature | Admin | Property Manager | Vendor | Tenant |
|---------|-------|-----------------|--------|--------|
| View admin panel (`/admin`) | Full | No | No | No |
| Manage users (CRUD) | Full | No | No | No |
| Manage vendors (approve/reject/status) | Full | Read | Own profile only | No |
| Manage projects (CRUD) | Full | Full | Read assigned only | No |
| Manage properties (CRUD) | Full | Full | No | No |
| View reports | Full | Full | Own reports | No |
| Manage payments (create/refund/payout) | Full | No | View own | No |
| Access vendor dashboard | Yes (bypass) | No | Full | No |
| Bid on RFQ projects | No | No | Full | No |
| View tenant portal | Yes (bypass) | No | No | Full |
| Make bookings | Yes | No | No | Full |
| Manage RFQs (create/edit/invite) | Full | Full | Bid only | No |
| View audit logs | Full | No | No | No |
| Security monitoring | Full | No | No | No |
| Team management | Full | No | No | No |
| Email center (send emails/newsletters) | Full | No | No | No |

### Role Storage
- Primary: `user_roles` table (user_id, role, granted_by, granted_at)
- Mirror: `profiles.role` column (kept in sync for display)
- Protection: `protected_admins` table prevents role removal for designated admins
- Triggers: `protect_admin_role` and `protect_admin_profile_role` enforce protection

### Role Assignment Flow
1. New user signs up -> `handle_new_user()` trigger creates profile with default role `tenant`
2. User submits access request via `submit_access_request()` RPC -> creates `user_approval_requests` record
3. Admin reviews and approves via `admin_assign_role()` RPC -> updates `user_roles` + `profiles.role`
4. If role is `vendor`, auto-creates `vendor_profiles` record

---

## 3. APPLICATION SITE MAP AND ROUTING

### Public Routes (no auth required)

| Path | Page | Description |
|------|------|-------------|
| `/` | Index (Homepage) | Landing page with hero, features, testimonials |
| `/properties` | Properties | Property listings with filters |
| `/properties/:id` | PropertyDetails | Individual property detail |
| `/booking/:id` | BookingPage | Property booking form |
| `/apartments/:id` | ApartmentBooking | Apartment-specific booking |
| `/book/:propertyId` | BookingPage | Alternate booking route |
| `/contact` | Contact | Contact form |
| `/services` | Services | Service overview |
| `/services/property-management` | PropertyManagement | Service detail |
| `/services/consultation` | Consultation | Service detail |
| `/services/maintenance` | Maintenance | Service detail |
| `/gallery` | Gallery | Photo gallery |
| `/amenities` | Amenities | Amenity showcase |
| `/news` | News | News articles (fetched via edge function) |
| `/bookmarks` | Bookmarks | Saved articles |
| `/auth` | Auth | Login/signup page |
| `/auth/verify` | AuthVerify | Email verification |
| `/auth/callback` | LoginBridge | OAuth/magic-link callback |
| `/login-bridge` | LoginBridge | Alternate callback |
| `/join-as-vendor` | JoinAsVendor | Vendor recruitment landing |
| `/request-quote` | RequestQuote | Quote request form |
| `/about` | About | About page |
| `/terms` | Terms | Terms of service |
| `/privacy` | Privacy | Privacy policy |
| `/vendors/:vendorId` | VendorShowcase | Public vendor profile |

### Authenticated Routes (any role)

| Path | Page | Required Role |
|------|------|---------------|
| `/dashboard` | Dashboard | Any authenticated |
| `/dashboard/settings` | UnifiedSettings | Any authenticated |
| `/settings` | UnifiedSettings | Any authenticated |

### Admin Routes

| Path | Required Role | Description |
|------|---------------|-------------|
| `/admin` | admin | Consolidated admin panel (tabs: dashboard, users, vendors, projects, properties, payments, security, monitoring, email) |
| `/admin/rfq` | admin | RFQ management list |
| `/admin/rfq/create` | admin | Create new RFQ |
| `/admin/rfq/:id` | admin | RFQ detail view |
| `/admin/rfq/:id/edit` | admin | Edit RFQ |
| `/admin/rfq/create-detailed` | admin | Detailed RFQ creation |
| `/admin/testing` | admin | Admin testing suite |
| `/admin/tenants` | admin | Tenant management |
| `/admin/audit` | admin | Audit log viewer |
| `/admin/work-orders` | admin | Work order management |
| `/admin/settings/labs` | admin | Experimental features |
| `/admin/operations` | admin | Operations control suite |
| `/admin/team` | admin | Team member management |
| `/admin/team/:memberId` | admin | Team member profile |
| `/admin/payouts` | admin | Payout processing |
| `/admin/design-tokens` | admin | Design system tokens |
| `/admin/component-playground` | admin | Component testing |
| `/design-system` | admin | Design system showcase |
| `/theme-preview` | admin | Theme preview |
| `/sitemap` | admin | Site map |

### Property Manager Routes

| Path | Required Role |
|------|---------------|
| `/dashboard/properties` | admin, property_manager |
| `/dashboard/tenants` | admin, property_manager |
| `/dashboard/projects` | admin, property_manager |
| `/dashboard/projects/:id` | admin, property_manager |
| `/dashboard/users` | admin only |

### Vendor Routes

| Path | Description |
|------|-------------|
| `/vendor` | Vendor dashboard (main) |
| `/vendor/projects` | Assigned projects list |
| `/vendor/projects/:id` | Project detail |
| `/vendor/applications` | Applications list |
| `/vendor/profile` | Profile editor |
| `/vendor/rfq` | RFQ browser |
| `/vendor/rfq/dashboard` | RFQ dashboard |
| `/vendor/rfq/:id` | RFQ detail |
| `/vendor/rfq/:id/details` | Enhanced RFQ detail |
| `/vendor/rfq/:id/bid` | Bid submission form |
| `/vendor/contracts` | Contracts list |
| `/vendor/contracts/:id` | Contract detail |
| `/vendor/payments` | Payment history |
| `/vendor/payouts` | Payout history |
| `/vendor/payout-settings` | Payout configuration |
| `/vendor/reports` | Vendor reports |
| `/vendor/documents` | Document management |
| `/vendor/settings` | Settings |
| `/vendor/subscription` | Subscription management |
| `/vendor/application` | Application form |
| `/vendor/leads` | Lead credits/management |
| `/vendor/notifications` | Notification center |
| `/vendor/inquiries` | Inquiry management |
| `/vendor/profile-showcase` | Public profile preview |
| `/vendor/messages` | Messaging |
| `/vendor/onboarding` | Onboarding start |

### Vendor Onboarding Wizard

| Path | Step |
|------|------|
| `/vendor-onboarding/profile` | Personal profile |
| `/vendor-onboarding/company` | Company details |
| `/vendor-onboarding/capabilities` | Skills/specialties |
| `/vendor-onboarding/compliance` | Documents/compliance |
| `/vendor-onboarding/review` | Review all info |
| `/vendor-onboarding/complete` | Completion |

### Redirect Rules

| From | To |
|------|-----|
| `/dashboard/vendors` | `/admin?tab=vendors` |
| `/vendor/dashboard` | `/vendor` |
| `/vendor-onboarding` | `/vendor-onboarding/profile` |
| `/admin/security-testing` | `/admin/testing` |
| `/admin/invoices` | `/admin?tab=payments` |
| `/admin/control-suite` | `/admin/operations` |
| `/rfq-system` | `/admin/rfq` |

### Error Routes
- `*` (catch-all) -> NotFound (404 page)
- Auth redirect: unauthenticated users redirected to `/auth` with `state.from` for return
- Role denied: redirected to `/dashboard` with toast error

---

## 4. FEATURE AND FUNCTION INVENTORY

### Module: Authentication
- Email/password signup and login
- Magic link authentication
- OAuth callback handling (`/auth/callback`, `/login-bridge`)
- Email verification flow
- Password reset (via edge function `send-password-reset`)
- Rate-limited auth attempts (client-side `withRateLimit` + DB `check_auth_rate_limit`)
- Session management via Supabase Auth
- CSRF protection tokens
- Profile cache with 5-minute TTL

### Module: Admin Dashboard (`/admin`)
Tab-based consolidated admin panel:
- **Dashboard**: Stats overview (total users, vendors, projects, properties, payments, security events)
- **Users**: User list, role assignment, access request approval queue, user deletion
- **Vendors**: Vendor list, verification, status updates, payment method viewing, subscription management, invite system
- **Projects**: Project CRUD, status updates, vendor assignment
- **Properties**: Property CRUD, image management
- **Payments**: Payment creation, refund processing, payout processing, invoice management, payment templates
- **Security**: Security event viewer, RLS testing, security audit dashboard
- **Monitoring**: System health, performance metrics
- **Email**: Email compose, template management, newsletter management, sent emails history

### Module: RFQ/RFP System
- **Admin**: Create RFQ with lots, invite vendors, review bids, score bids, award contracts
- **Vendor**: Browse open RFQs, submit bids with line items, view bid status
- **Scoring**: Automated bid scoring via `calculate_bid_score()` (price 30%, rating 25%, completion 20%, tier 10%)
- **Templates**: Reusable RFQ templates with default milestones
- **Documents**: RFQ document attachments (blueprints, specs)

### Module: Vendor Management
- Vendor onboarding wizard (6-step)
- Profile management (company info, specialties, certifications, service areas)
- Document management (upload, verification by admin)
- Subscription tiers (free, basic, premium, enterprise)
- Tier system (bronze, silver, gold, platinum based on performance)
- Portfolio items (before/after images)
- Reviews and ratings
- Availability status management
- Lead credits system
- Inquiry system (vendor-to-admin communication)
- Payout settings (bank account, card)

### Module: Project Management
- Project CRUD with categories, budgets, deadlines, priority
- Milestone tracking with deliverables
- Vendor assignment (manual by admin or via RFQ award)
- Document attachments
- Status workflow: draft -> open -> in_progress -> completed/cancelled/on_hold

### Module: Property Management
- Property listings with filtering (type, price, bedrooms, city)
- Property detail pages with image galleries
- Booking system (date selection, guest details, payment)
- Property inquiries
- Amenity management

### Module: Payments (Stripe Integration)
- Vendor payment creation by admin
- Stripe Checkout for payment processing
- Payment refund processing
- Vendor payouts
- Payment method management
- Invoice generation (PDF via @react-pdf/renderer)
- Payment templates for recurring payment types
- Payment notifications (email + in-app)

### Module: Notifications
- In-app notifications (bell icon with badge)
- Real-time notifications via Supabase Realtime
- Email notifications via Resend (edge functions)
- SMS notifications (edge function `send-sms`)
- Notification settings per user
- WhatsApp floating button

### Module: News/Content
- News article fetching (external API via edge function `fetch-news`)
- Article bookmarking
- News analytics tracking
- Newsletter management and sending
- Admin news panel

### Module: Messaging
- Room-based messaging system
- Room member access control
- Real-time message delivery

### Module: Team Management
- Team member CRUD
- Team member profiles with skills, department, role
- Hire date tracking

---

## 5. WORKFLOW AND PROCESS FLOWS

### Vendor Onboarding Flow
1. User visits `/join-as-vendor` -> sees recruitment page
2. User signs up via `/auth` with basic account
3. User submits access request for `vendor` role via `submit_access_request()` RPC
4. Admin receives notification -> reviews in `/admin?tab=users` access request queue
5. Admin approves -> `admin_assign_role()` creates vendor role + `vendor_profiles` record
6. Vendor redirected to onboarding wizard (`/vendor-onboarding/profile`)
7. Vendor completes 6 steps: profile -> company -> capabilities -> compliance -> review -> complete
8. Admin verifies vendor documents and sets `is_verified = true`

### RFQ Bidding Flow
1. Admin creates RFQ at `/admin/rfq/create` with title, description, deadline, lots
2. Admin invites specific vendors via `invite_vendors_to_rfq()` RPC
3. Vendors receive notification -> view RFQ at `/vendor/rfq/:id`
4. Vendor submits bid with line items per lot via `submit_bid()` RPC
5. System auto-calculates bid score via `calculate_bid_score()`
6. Admin reviews bids at `/admin/rfq/:id`
7. Admin awards contract via `award_contract()` RPC
8. Contract created, vendor notified, project status updated

### Payment Flow
1. Admin creates payment for vendor via `admin_create_payment()` or `admin_create_vendor_payment_secure()`
2. Vendor receives notification with payment details
3. Vendor pays via Stripe Checkout (edge function `create-payment` or `create-vendor-payment`)
4. Stripe webhook (`stripe-webhook`) updates payment status
5. Payment notification sent (edge function `send-payment-notification`)
6. Admin can process payouts via `admin_send_payout()`
7. Payout notification sent (edge function `send-payout-notification`)

### Property Booking Flow
1. User browses properties at `/properties`
2. User selects property -> `/properties/:id`
3. User clicks book -> `/booking/:id` or `/book/:propertyId`
4. User fills booking form (dates, guests, details)
5. Booking created in `bookings` table
6. Payment processed via Stripe
7. Confirmation notification sent

---

## 6. DATA MODEL AND DATABASE SCHEMA

### Core Tables (50+ tables)

**Identity & Access**
- `profiles` (id[uuid/PK], email, full_name, phone, role, avatar_url, tenant_id, address, city, state, zip_code, sms_enabled, status, created_at, updated_at)
- `user_roles` (id, user_id->profiles, role, granted_by->profiles, granted_at)
- `protected_admins` (user_id[PK], protected_at, protected_by, reason)
- `user_approval_requests` (id, user_id, email, full_name, role_requested, company_name, phone, status, admin_notes, reviewed_by, reviewed_at)
- `tenants` (id, name, plan, created_at, updated_at) -- organizational tenant for multi-tenancy

**Properties & Bookings**
- `properties` (id[serial/PK], title, description, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet, property_type, status, amenities, image_urls, available_date, latitude, longitude, owner_id)
- `bookings` (id, user_id->profiles, property_id->properties, check_in_date, check_out_date, guests, total_amount, status, payment_status, guest_details[JSON], special_requests)
- `property_inquiries` (id, property_id->properties, user_id->profiles, name, email, phone, message, inquiry_type, status)

**Vendor Management**
- `vendor_profiles` (id, user_id->profiles[unique], company_name, description, phone, email, address, website, specialties[array], certifications[array], service_areas[array], years_experience, rating, average_rating, completed_jobs, response_time_hours, availability_status, is_verified, verification_status, verification_approved_by, verification_approved_at, subscription_plan, subscription_tier, subscription_status, subscription_expires_at, avatar_url, public_avatar_url, business_license, insurance_verified, background_check_verified, success_rate, last_active_at, tenant_id)
- `vendor_documents` (id, vendor_id, document_type, file_name, file_path, file_url, file_size, mime_type, is_verified, verified_by, verified_at, uploaded_at)
- `vendor_applications` (id, user_id->profiles, project_title, project_description, project_type, property_id->properties, budget_min, budget_max, deadline, location, preferred_start_date, priority, status)
- `vendor_bids` (id, vendor_id, project_id->projects, rfq_id->rfqs, application_id->vendor_applications, bid_amount, proposal_details, estimated_duration, pricing[JSON], certifications[JSON], experience[JSON], company_info[JSON], document_uploads[JSON], status, admin_feedback, admin_notes[JSON], feedback_by, feedback_at, terms_accepted, terms_accepted_at, submitted_at)
- `vendor_reviews` (id, vendor_id->vendor_profiles, reviewer_id, project_id->projects, overall_rating, quality_rating, communication_rating, punctuality_rating, value_rating, review_text, photos[array], vendor_response, vendor_response_at, status, is_verified_project)
- `vendor_tiers` (id, vendor_id->vendor_profiles[unique], current_tier, total_completed_jobs, average_rating, review_count, next_tier_progress[JSON], tier_updated_at)
- `vendor_contacts` (id, vendor_id, name, email, phone, company, contact_type, source, status, notes, last_contact_date, next_followup_date)
- `vendor_invitations` (id, email, company_name, specialties[array], invite_message, invited_by, invited_at, accepted_at, status)
- `vendor_inquiries` (id, vendor_id->profiles, subject, message, category, priority, status, admin_response, responded_by, responded_at)
- `vendor_portfolio_items` (id, vendor_id, title, description, category, before_image_url, after_image_url, client_name, completion_date, tags[array], display_order, is_featured, project_id->projects)

**Projects & RFQ**
- `projects` (id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, property_id, created_by, assigned_vendor_id, skills_required[array], attachments[array], requirements_documents[array], documents[JSON], tenant_id)
- `project_milestones` (id, project_id->projects, name, description, amount, order_index, status, due_date, completion_date, completed_by)
- `project_documents` (id, project_id->projects, file_name, file_path, file_type, file_size, uploaded_by->profiles, is_required_for_bidding)
- `project_assignments` (id, project_id->projects, vendor_id, assigned_by, estimated_hours, hourly_rate, status)
- `rfqs` (id, title, description, category, status, deadline, property_id, created_by, tenant_id, budget_guidance[JSON], building_details[JSON], codes_compliance[JSON], commercial_framework[JSON], executive_summary[JSON], document_control[JSON], plus many more JSON fields)
- `rfq_lots` (id, rfq_id->rfqs, lot_name, quantity, unit_of_measure, specifications[JSON])
- `rfq_invites` (id, rfq_id->rfqs, vendor_id, invited_by, invited_at, status)
- `rfq_documents` (id, rfq_id->rfqs, file_name, file_path, file_url, file_size, mime_type, document_type, category_badge, uploaded_by, is_required_for_bidding)
- `rfq_templates` (id, name, description, category, scope_of_work, estimated_budget_min, estimated_budget_max, typical_duration_days, required_certifications[array], default_milestones[JSON], is_active, created_by)
- `bid_lines` (id, rfq_lot_id->rfq_lots, vendor_id, unit_price, notes, submitted_at)
- `bid_scores` (id, bid_id->vendor_bids, price_score, rating_score, completion_rate_score, response_time_score, tier_bonus, total_score, scored_at, scored_by)
- `bid_comments` (id, bid_id->vendor_bids, user_id, comment, comment_type, is_internal)
- `contracts` (id, title, description, contract_number, vendor_id, project_id->projects, rfq_id->rfqs, contract_value, start_date, end_date, status, terms[JSON], tenant_id, created_by)

**Payments & Financial**
- `vendor_payments` (id, vendor_id, created_by, title, description, amount, payment_type, status, due_date, paid_at, payment_method, stripe_payment_intent_id, stripe_session_id, refunded_at, notes, metadata[JSON], template_id, user_type)
- `vendor_payouts` (id, vendor_id, amount, status, reference, notes, payout_date, payout_method, processed_by, transaction_id, vendor_acknowledged, vendor_notes, acknowledged_at, requested_at, metadata[JSON])
- `vendor_payout_settings` (id, vendor_id->profiles[unique], payout_method, payout_schedule, account_holder_name, bank_account_last4, routing_number, card_brand, card_last4, tax_id_last4, minimum_payout_amount, is_verified, verified_by, verified_at)
- `vendor_payment_methods` (id, vendor_id, type, is_default, details[JSON], created_at)
- `vendor_lead_credits` (id, vendor_id, credits_remaining, plan_type, purchased_at, expires_at)
- `payment_documents` (id, payment_id->vendor_payments, file_name, file_path, file_size, file_type, uploaded_by)
- `payment_refunds` (id, payment_id->vendor_payments, amount, reason, status, stripe_refund_id, requested_by->profiles, processed_by->profiles, admin_notes)
- `payment_templates` (id, name, description, amount, payment_type, is_active, created_by)
- `payments` (id, amount, payment_date, payment_method, reference_number, status, notes, contract_id->contracts, invoice_id->invoices, tenant_id, created_by)
- `invoices` (id, invoice_number, client_name, client_email, amount, currency, description, status, due_date, line_items[JSON], project_id->projects, vendor_id, milestone_id->project_milestones, invoice_type, tenant_id, created_by)
- `financial_reports` (id, title, report_type, period_start, period_end, total_revenue, total_expenses, net_profit, data[JSON], generated_by)
- `stripe_customers` (id, user_id, stripe_customer_id)
- `stripe_payments` (id, user_id, amount, currency, status, stripe_payment_intent_id, stripe_checkout_session_id, description, metadata[JSON])
- `stripe_subscriptions` (id, user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_start, current_period_end, cancel_at_period_end)
- `subscribers` (id, email, user_id, subscribed, subscription_tier, stripe_customer_id, subscription_end)
- `subscription_requests` (id, vendor_id->profiles, requested_plan, current_plan, status, admin_notes, processed_by->profiles, processed_at, requested_at)
- `transactions` (id, user_id->profiles, booking_id->bookings, application_id->vendor_applications, amount, currency, status, payment_method, stripe_payment_intent_id, stripe_session_id, completed_at)

**Communication**
- `notifications` (id, user_id, title, message, type, read, action_url, category, priority)
- `messages` (id, sender_id, recipient_id, subject, content, is_read, parent_message_id->messages[self-ref])
- `room_members` (inferred from `can_access_room()` function)
- `sent_emails` (id, recipient_email, recipient_name, recipient_user_id, subject, html_content, text_content, email_type, template_used, status, sent_at, sent_by, error_message, opened_at, parent_email_id->sent_emails[self-ref], resend_count, metadata[JSON])
- `email_templates` (id, name, subject, html_content, text_content, variables[JSON], is_active)
- `newsletter_subscriptions` (id, email, user_id, subscription_type, categories[array], is_active, confirmed_at, unsubscribed_at)
- `user_notification_settings` (id, user_id, email_notifications, push_notifications, payment_alerts, project_updates, security_alerts, invoice_alerts, marketing_emails)

**News & Content**
- `news_articles` (id, title, description, content, url, source, source_type, author, category, image_url, published_at, is_featured, is_published, external_id, created_by)
- `news_analytics` (id, article_id, event_type, user_id, session_id, article_title, category, source)
- `article_bookmarks` (id, user_id, article_id, article_title, article_url, article_source, article_image_url, article_published_at, notes, bookmarked_at)

**Security & Audit**
- `audit_logs` (id, user_id, action, table_name, record_id, old_values[JSON], new_values[JSON], ip_address, user_agent, tenant_id->tenants) -- immutable (DELETE prevented)
- `security_events` (id, event_type, severity, user_id, details[JSON], ip_address, user_agent)
- `profile_name_audit` (id, profile_id->profiles, old_name, new_name, changed_by->profiles, change_reason, ip_address, user_agent, changed_at)
- `rate_limits` (id, endpoint, identifier, requests_count, window_start)

**System**
- `system_health` (id, service_name, status, error_message, response_time_ms, metadata[JSON], checked_at)
- `system_settings` (key[PK], value, description, category)
- `team_members` (id, full_name, email, phone, role, title, department, bio, avatar_url, skills[array], hire_date, status, user_id)
- `user_preferences` (id, user_id, email_notifications, sms_notifications, push_notifications, bid_notifications, payment_alerts, project_alerts, phone_number, profile_visibility, two_factor_enabled, two_factor_verified_at)
- `quick_quote_requests` (id, title, description, service_category, budget_min, budget_max, urgency, location_address, location_city, location_zip, preferred_start_date, contact_name, contact_email, contact_phone, property_id->properties, property_manager_id, status, expires_at)
- `maintenance_requests` (id, title, description, category, priority, status, property_id, property_name, tenant_id, assigned_vendor_id, assigned_vendor_name, cost_estimate, actual_cost, scheduled_date, completed_date, images[array], notes)
- `documents` (id, file_name, file_path, file_url, file_size, mime_type, related_to_type, related_to_id, tenant_id, uploaded_by)
- `compliance_docs` (id, vendor_id, tenant_id, doc_name, doc_type, file_path, file_url, status, expiry_date, verified_by, verified_at)
- `milestone_deliverables` (id, milestone_id->project_milestones, file_name, file_path, file_url, file_size, mime_type, uploaded_by, is_approved, approved_by, approved_at)

### Database Views
- `bookings_staff_view` -- staff-accessible booking view
- `public_property_listings_masked` -- public listings with masked addresses and price ranges
- `safe_property_listings` -- safe property view without owner info
- `safe_vendor_profiles` -- vendor profiles with masked PII (email, phone, address)
- `vendor_documents_safe` -- documents without raw file paths/URLs
- `vendor_invoice_summary` -- invoice summary with masked client email

### Key Relationships
- `profiles.id` -> references `auth.users.id` (created via trigger)
- `profiles.tenant_id` -> `tenants.id` (organizational isolation)
- `vendor_profiles.user_id` -> `profiles.id` (1:1)
- `projects.assigned_vendor_id` -> user_id (vendor)
- `projects.tenant_id` -> `tenants.id`
- `rfqs` -> `rfq_lots` (1:M), `rfq_invites` (1:M), `rfq_documents` (1:M)
- `vendor_bids` -> `bid_scores` (1:1), `bid_comments` (1:M), `bid_lines` (1:M via rfq_lots)
- `contracts` -> `projects`, `rfqs`, `tenants`

---

## 7. AUTHENTICATION AND SECURITY

### Authentication
- **Method**: Supabase Auth (email/password + magic links)
- **Session**: JWT-based, 3600s expiry (1 hour), auto-refresh
- **Callback URL**: `https://monarchpropertymmgt.com/*`
- **Additional Redirects**: Lovable preview domains, localhost:3000, localhost:5173

### Security Functions (SECURITY DEFINER, SET search_path='public')
- `is_admin_user(user_uuid)` -- check admin role
- `user_has_role(role_name)` -- check role via profiles table
- `current_user_has_role(role_name)` -- check role via user_roles table
- `is_tenant_admin(user_uuid, target_tenant_id)` -- tenant-scoped admin check
- `user_has_role_in_tenant(user_uuid, role_name, target_tenant_id)` -- tenant-scoped role check
- `is_staff_in_tenant(target_tenant_id)` -- staff check with tenant scope
- `is_staff_or_admin()` -- combined staff check
- `mask_email(email)` -- PII masking
- `validate_and_sanitize_input(p_input, p_max_length, p_allow_html)` -- input sanitization
- `validate_password_strength(password)` -- password validation
- `validate_file_upload()` -- trigger for file validation (size, path traversal, MIME type)

### Rate Limiting
- Client-side: `withRateLimit()` wrapper around auth calls
- Database: `check_rate_limit()`, `check_auth_rate_limit()`, `enhanced_rate_limit_check()`, `optimized_rate_limit_check()` RPCs
- `rate_limits` table tracks per-endpoint, per-identifier request counts
- Edge function: `rate-limit-middleware` shared module

### Data Isolation
- Multi-tenant via `tenant_id` column on key tables
- `current_user_tenant_id()` helper function
- RLS policies use tenant-scoped checks
- Protected admin table prevents super-admin role tampering

### Audit Logging
- `audit_logs` table (immutable -- DELETE prevented)
- `security_events` table for security-specific events
- `profile_name_audit` for name change tracking
- `log_security_event()`, `log_authorization_failure()`, `log_table_access()` trigger functions
- `log_sensitive_access()` trigger on sensitive table reads

### Content Security
- `SecurityHeaders` component (CSP headers)
- CSRF token initialization
- DOMPurify for HTML sanitization
- Input validation triggers on file uploads

---

## 8. TECH STACK AND ARCHITECTURE

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: react-router-dom v7.12.0
- **Build Tool**: Vite (with PWA plugin, terser minification)
- **Styling**: Tailwind CSS + tailwindcss-animate + class-variance-authority
- **State Management**: React Context (AuthContext, LanguageContext) + TanStack React Query v5
- **UI Components**: Radix UI primitives (30+ components) + shadcn/ui patterns
- **Forms**: react-hook-form + zod validation + @hookform/resolvers
- **Rich Text**: TipTap editor
- **Charts**: Recharts
- **PDF Generation**: @react-pdf/renderer
- **Notifications**: Sonner toasts
- **SEO**: react-helmet-async
- **Analytics**: @vercel/analytics, web-vitals
- **Error Tracking**: @sentry/react, react-error-boundary
- **Accessibility**: @axe-core/react, A11yProvider
- **Testing**: Vitest + @testing-library/react + Playwright (E2E) + Storybook + Chromatic
- **i18n**: Custom LanguageContext with locale files

### Backend
- **Database**: Supabase PostgreSQL 17.4
- **Auth**: Supabase Auth
- **API**: Supabase REST API (PostgREST) + RPC functions
- **Edge Functions**: Deno (Supabase Edge Functions) -- 37 functions
- **Storage**: Supabase Storage (avatars, vendor_docs, project_files buckets)
- **Realtime**: Supabase Realtime (postgres_changes subscriptions)

### External Services
- **Payments**: Stripe (checkout, webhooks, subscriptions, refunds)
- **Email**: Resend (transactional emails)
- **SMS**: Via edge function `send-sms`
- **News**: External news API via `fetch-news` edge function
- **Hosting**: Vercel (frontend) + Supabase (backend)
- **Analytics**: Vercel Web Analytics

### Environment Variables
```
VITE_SUPABASE_URL=https://yhegaaqxmuhszesbjtdo.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=yhegaaqxmuhszesbjtdo
```

### Edge Function Secrets (server-side only)
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

---

## 9. DESIGN SYSTEM AND UI PATTERNS

### Brand Identity
- **Primary Color**: Monarch Gold -- HSL(32, 82%, 33%) -- WCAG AA compliant
- **Secondary Color**: Brand Teal -- HSL(175, 35%, 35%)
- **Success**: Sage Green -- HSL(155, 60%, 35%)
- **Warning**: Amber -- HSL(38, 92%, 50%)
- **Error**: Soft Red -- HSL(0, 75%, 55%)
- **Info**: Sky Blue -- HSL(200, 70%, 50%)

### Surface Colors (Light Mode)
- Background: Warm off-white HSL(40, 25%, 97%)
- Foreground: Near-black HSL(0, 0%, 8%) -- maximum contrast
- Cards: Pure white
- Muted foreground: HSL(0, 0%, 18%) -- WCAG AAA 8:1

### Dark Mode
- Full dark theme with inverted surfaces
- Background: HSL(220, 20%, 8%)
- Card: HSL(220, 18%, 12%)
- All colors recalculated for dark contrast

### Typography
- **Primary Font**: Inter (body text)
- **Display Font**: Playfair Display (headings, hero sections)
- **Monospace**: JetBrains Mono (code, technical data)

### Layout
- Sidebar navigation for authenticated pages (`AppSidebar` + `SidebarLayout`)
- Public pages use `Navbar` + `Footer`
- `OptimizedLayout` wraps all routes, conditionally shows sidebar for protected routes
- Responsive: Mobile sidebar via Sheet component (slide-out drawer)
- Z-index hierarchy: base(0) < content(10) < dropdown(50) < sticky(100) < header(150) < drawer(160) < modal-overlay(400) < modal-content(401) < select-dropdown(500) < toast(600)

### Component Patterns
- Cards with neumorphic/glassmorphic styling
- Radix UI primitives for all interactive elements
- Skeleton loaders for async content
- Error boundary fallbacks
- Lazy loading with Suspense
- Command palette (Cmd+K)
- Toast notifications (bottom-right)

### Spacing and Grid
- Border radius: 0.75rem (default)
- Shadow scale: sm, md, lg, xl, primary, glow, brand
- Gradient system: primary, primary-vibrant, secondary, subtle, shimmer

---

## 10. INTERNAL TOOLS AND ADMIN PANELS

### Admin Control Suite (`/admin/operations`)
- System diagnostics
- Health check dashboard
- Configuration management

### Admin Testing (`/admin/testing`)
- Security testing dashboard
- RLS policy testing
- Connection testing

### Admin Labs (`/admin/settings/labs`)
- Experimental feature flags
- INFERRED: Feature toggle system

### Design System Tools
- `/design-system` -- Component showcase
- `/admin/design-tokens` -- Token viewer/editor
- `/admin/component-playground` -- Interactive component testing
- `/theme-preview` -- Theme preview

### Monitoring
- `ProductionHealthMonitor` component
- `UnifiedPerformanceMonitor` (web vitals tracking)
- System health table with periodic checks
- Edge function: `system-health-monitor`, `production-health-monitor`

---

## 11. INTEGRATIONS AND EXTERNAL CONNECTIONS

### Stripe
- **Edge Functions**: `create-payment`, `create-vendor-payment`, `create-checkout`, `create-vendor-checkout`, `create-payment-method`, `customer-portal`, `process-refund`, `process-withdrawal`, `stripe-webhook`, `check-subscription`
- **Webhook**: `stripe-webhook` (verify_jwt: false) handles payment completion events
- **Tables**: `stripe_customers`, `stripe_payments`, `stripe_subscriptions`

### Resend (Email)
- **Edge Functions**: `send-email`, `send-welcome-email`, `send-password-reset`, `send-rfq-invitation`, `send-bid-confirmation`, `send-bid-rejection`, `send-contract-award`, `send-rfq-reminders`, `send-payout-notification`, `send-payment-notification`, `send-newsletter`, `send-custom-notification`, `send-invoice`, `send-bid-deadline-approaching`
- **Tables**: `sent_emails`, `email_templates`

### SMS
- **Edge Function**: `send-sms` (verify_jwt: true)

### News API
- **Edge Function**: `fetch-news` (verify_jwt: false) -- fetches external news articles

### Supabase Storage Buckets
- `avatars` (public) -- user profile pictures
- `vendor_docs` (private) -- vendor documents with RLS
- `project_files` (private) -- project attachments

### Vercel
- Web Analytics (conditional on Vercel-hosted domains)
- Frontend hosting and deployment

---

## 12. ERROR HANDLING AND EDGE CASES

### Error Boundaries
- `GlobalErrorBoundary` -- top-level catch-all (main.tsx)
- `ComprehensiveErrorBoundary` -- per-section error handling
- `ErrorBoundaryFallback` -- reusable fallback UI

### Auth Error Handling
- Invalid credentials -> toast with specific message
- Email not confirmed -> toast with specific message
- Rate limit exceeded -> toast with cooldown message
- User already registered -> toast with specific message

### API Error Handling
- Supabase errors surfaced via toast notifications
- RPC functions return JSON with `success: boolean, message: string`
- Edge functions return HTTP status codes with JSON error bodies
- SECURITY: Generic error messages to clients, detailed logging server-side

### Edge Cases
- Stale approval requests for users who already have roles (resolved by checking existing role before displaying pending status)
- Protected admins cannot have role removed (trigger enforcement)
- File upload validation: size limits, path traversal prevention, MIME type whitelist
- Profile cache invalidation on sign-in and profile updates
- Vendor auto-redirect from `/dashboard` to `/vendor`
- Auth loading timeout (5-second fallback to prevent infinite loading)

---

## 13. CONFIGURATION AND ENVIRONMENT VARIABLES

### Required Client-Side
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY (labeled as VITE_SUPABASE_PUBLISHABLE_KEY)
VITE_SUPABASE_PROJECT_ID
```

### Required Server-Side (Edge Function Secrets)
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

### Supabase Config (supabase/config.toml)
- API max_rows: 1000
- Auth site_url: https://monarchpropertymmgt.com
- JWT expiry: 3600 seconds
- Storage file_size_limit: 50MiB
- Email: double_confirm_changes enabled, confirmations disabled
- Edge functions with verify_jwt settings per function

### Edge Functions JWT Configuration
- `verify_jwt: false` (public): stripe-webhook, health-check, send-payment-notification, send-welcome-email, send-password-reset, send-rfq-reminders, fetch-news, send-bid-deadline-approaching
- `verify_jwt: true` (authenticated): all others

---

## 14. PERFORMANCE AND SCALABILITY

### Code Splitting
- Aggressive lazy loading via `React.lazy()` for all non-landing pages
- Only Index and NotFound pages eagerly loaded
- Command palette lazy-loaded separately

### Caching
- Profile data cached with 5-minute TTL (client-side Map)
- TanStack Query for server state caching with configurable stale times
- Service worker for static asset caching (VitePWA)
- Database query results pagination: default `.range(0, 24)` or `.limit()` patterns

### Optimization
- `setupAutoOptimizations()` and `preloadCriticalAssets()` on startup
- `UnifiedPerformanceMonitor` tracks web vitals
- Image optimization utilities (`imageOptimizer`, `LazyImage`, `SafeImage`)
- Intersection Observer for lazy image loading
- CSS critical path inlining
- Terser minification in production build
- `requestIdleCallback` for deferred non-critical work

### Database Performance
- RPC functions for complex queries (single round-trip)
- `get_user_profile_with_roles()` fetches profile + roles + vendor data in one call
- `get_vendor_dashboard_stats()` aggregates all vendor stats in one query
- `get_admin_dashboard_stats_optimized()` batches admin stats
- Explicit column selection (no SELECT *)
- Pagination on all list queries

### Scalability Considerations
- Multi-tenant architecture supports organizational isolation
- Rate limiting at both client and database levels
- Edge functions are stateless and horizontally scalable
- Supabase Realtime for push-based updates (reduces polling)

---

## 15. ROADMAP AND EXTENSIBILITY NOTES

### Areas Designed for Expansion
- `property_owner` role exists in enum but is not actively used -- ready for owner portal
- `tenants` table (organizational) has `plan` column for SaaS tier management
- `compliance_docs` table exists for formal compliance tracking
- `maintenance_requests` table ready for tenant-facing maintenance portal
- `documents` generic table with `related_to_type/id` polymorphic pattern
- Lease management (referenced in role scopes but not implemented as tables)

### Technical Debt Indicators
- Dual role storage: `user_roles` table AND `profiles.role` column must be kept in sync
- Multiple overlapping rate limit functions: `check_rate_limit`, `check_auth_rate_limit`, `enhanced_rate_limit_check`, `enhanced_auth_rate_limit_check`, `optimized_rate_limit_check`
- Multiple overlapping vendor approval functions: `admin_approve_vendor` (two signatures), `admin_approve_vendor_enhanced`
- Multiple overlapping project status functions: `update_project_status` (two signatures), `admin_update_project_status_secure`
- Security utility files scattered across: `utils/security.ts`, `utils/securityHelpers.ts`, `utils/securityAudit.ts`, `utils/securityMonitoring.ts`, `utils/optimizedSecurity.ts`, `utils/productionSecurity.ts`
- Multiple health check components: `AppHealthCheck`, `ProductionHealthCheck`, `ProductionHealthMonitor`, `SystemHealthCheck`, `SystemHealthDashboard`
- `properties.id` is `serial` (integer) while all other tables use UUID -- inconsistency

### Features Requiring Refactoring
- Messaging system uses basic `messages` table with no room concept in schema (room logic is in functions only)
- The `rfqs` table has 20+ JSON columns that could be normalized into related tables
- Vendor subscription management splits between local DB tracking and Stripe subscriptions
- Some admin functions have duplicate insecure/secure versions that should be consolidated

### Modular Boundaries
- Each vendor page is a standalone page component with its own data hooks
- Admin panel is well-consolidated into tabbed `AdminManagementSystem`
- Edge functions follow single-responsibility principle
- Design system has dedicated directory with tokens and components
- Hooks directory provides clean data access layer

---

## APPENDIX A: EDGE FUNCTIONS INVENTORY (37 functions)

| Function | JWT | Purpose |
|----------|-----|---------|
| admin-update-vendor-subscription | true | Admin updates vendor subscription plan |
| check-compliance-expiry | - | Check for expiring compliance documents |
| check-subscription | - | Verify subscription status |
| create-checkout | true | Create Stripe checkout session |
| create-payment | true | Create Stripe payment intent |
| create-payment-method | true | Save payment method |
| create-vendor-checkout | - | Vendor-specific checkout |
| create-vendor-payment | - | Vendor payment processing |
| customer-portal | - | Stripe customer portal redirect |
| fetch-news | false | Fetch external news articles |
| generate-sitemap | - | Generate XML sitemap |
| get-user-capabilities | - | Server-side capability check |
| get-vendor-dashboard-summary | - | Vendor dashboard data |
| health-check | false | System health endpoint |
| process-refund | true | Process payment refund |
| process-withdrawal | true | Process vendor withdrawal |
| production-health-monitor | - | Production health checks |
| rate-limit-middleware | - | Shared rate limiting module |
| request-subscription-upgrade | true | Vendor requests plan upgrade |
| send-bid-confirmation | true | Email: bid confirmed |
| send-bid-deadline-approaching | false | Email: bid deadline reminder |
| send-bid-rejection | true | Email: bid rejected |
| send-contract-award | true | Email: contract awarded |
| send-custom-notification | true | Email: custom notification |
| send-email | true | Generic email sending |
| send-invoice | true | Email: invoice |
| send-newsletter | true | Email: newsletter blast |
| send-password-reset | false | Email: password reset |
| send-payment-notification | false | Email: payment notification |
| send-payout-notification | true | Email: payout notification |
| send-rfq-invitation | true | Email: RFQ vendor invitation |
| send-rfq-reminders | false | Email: RFQ deadline reminders |
| send-sms | true | SMS notification |
| send-welcome-email | false | Email: welcome message |
| stripe-webhook | false | Stripe event handler |
| system-health-monitor | - | System health checks |

---

## APPENDIX B: DATABASE FUNCTIONS INVENTORY (60+ functions)

Categorized by purpose:

**Auth/Role Checks**: `is_admin_user`, `is_current_user_admin`, `current_user_has_role`, `user_has_role` (2 signatures), `is_staff_or_admin`, `is_tenant_admin`, `user_has_role_in_tenant`, `is_staff_in_tenant`, `has_role`, `get_current_user_roles`, `get_user_roles`

**Admin Operations**: `admin_assign_role`, `admin_approve_vendor` (2 signatures), `admin_approve_vendor_enhanced`, `admin_assign_vendor_to_project_secure`, `admin_update_vendor_status_secure`, `admin_update_project_status_secure`, `admin_create_payment`, `admin_create_vendor_payment`, `admin_create_vendor_payment_secure`, `admin_send_payout`, `admin_get_vendor_payment_methods`, `admin_invite_vendor`, `admin_create_project`, `set_user_role`

**RFQ/Bidding**: `create_rfq`, `invite_vendors_to_rfq`, `submit_bid`, `calculate_bid_score`, `award_contract`

**Vendor**: `get_vendor_dashboard_stats`, `get_vendor_dashboard_summary_optimized`, `get_vendor_projects_summary`, `search_vendors_public`, `update_vendor_profile_secure`, `get_vendor_emails`, `get_masked_vendor_data`, `update_vendor_tier` (trigger)

**Security/Audit**: `log_security_event`, `log_authorization_failure`, `log_audit_event_secure`, `log_security_audit`, `log_security_audit_enhanced`, `log_sensitive_access`, `log_table_access`, `validate_file_upload` (trigger), `validate_and_sanitize_input` (3 versions), `validate_password_strength`, `mask_email`

**Rate Limiting**: `check_rate_limit`, `check_auth_rate_limit`, `enhanced_rate_limit_check`, `enhanced_auth_rate_limit_check`, `optimized_rate_limit_check`, `cleanup_rate_limits`

**User/Profile**: `handle_new_user` (trigger), `get_user_profile_with_roles`, `submit_access_request`, `has_pending_access_request`, `audit_profile_name_change` (trigger), `protect_admin_role` (trigger), `protect_admin_profile_role` (trigger), `update_vendor_avatar` (trigger)

**Utility**: `current_user_id`, `get_user_id`, `current_user_tenant_id`, `get_user_tenant_id`, `room_id_from_topic`, `can_access_room`, `test_connection`, `get_admin_dashboard_stats`, `get_admin_dashboard_stats_optimized`, `get_admin_testing_stats`, `get_project_stats`, `get_public_property_listings`, `get_public_property_count`, `get_recent_activity_summary`, `get_tenant_emails`, `get_document_signed_url`, `get_profile_image_url`, `migrate_existing_avatars`, `create_secure_notification`, `is_dashboard_query`

---

## APPENDIX C: PROVIDER HIERARCHY (main.tsx)

```text
GlobalErrorBoundary
  HelmetProvider
    QueryProvider (TanStack Query)
      SessionProvider (Supabase session)
        AuthProvider (role-aware user context)
          A11yProvider (accessibility)
            UnifiedPerformanceMonitor
            App
              SecurityHeaders
              ThemeProvider (dark/light/system)
                LanguageProvider
                  TooltipProvider
                    OptimizedSecurityProvider (rate limiting)
                      Toaster (sonner)
                      BrowserRouter
                        CommandPalette (lazy)
                        OptimizedLayout (sidebar logic)
                          Suspense
                            Routes
                        WhatsAppFloatingButton
```

---

**END OF BLUEPRINT**

This document contains all information necessary to rebuild the Monarch Property Management application from scratch. All structural, behavioral, data, and integration details have been extracted from the source code and database schema. Items marked as INFERRED are conservative assumptions clearly labeled.

