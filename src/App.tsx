
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
// AuthProvider is already in main.tsx - do not duplicate
import { ThemeProvider } from "./design-system/ThemeProvider";
import { SecurityHeaders } from "@/components/SecurityHeaders";
import { OptimizedSecurityProvider } from "@/components/OptimizedSecurityProvider";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import OptimizedLayout from "@/components/OptimizedLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { lazy, Suspense } from "react";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

// Lazy load CommandPalette - not needed for initial page interaction
const CommandPalette = lazy(() => import("@/components/CommandPalette"));

// Eager load only the landing page for first paint - auth pages are lazy loaded
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load auth pages - not needed on initial homepage render
const Auth = lazy(() => import("./pages/Auth"));
const LoginBridge = lazy(() => import("./pages/auth/LoginBridge"));
const AuthVerify = lazy(() => import("./pages/auth/AuthVerify"));

// AdminManagementSystem lazy-loaded to prevent eagerly bundling all admin components
const AdminManagementSystem = lazy(() => import("./components/AdminManagementSystem"));

// Lazy load non-critical pages for code splitting and performance
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const Services = lazy(() => import("./pages/Services"));
const PropertyManagement = lazy(() => import("./pages/services/PropertyManagement"));
const Consultation = lazy(() => import("./pages/services/Consultation"));
const Maintenance = lazy(() => import("./pages/services/Maintenance"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Amenities = lazy(() => import("./pages/Amenities"));
const News = lazy(() => import("./pages/News"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const AuthDebug = lazy(() => import("./pages/AuthDebug"));
const AuthTest = lazy(() => import("./pages/AuthTest"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
// UserProfile consolidated into UnifiedSettings
const UnifiedSettings = lazy(() => import("./pages/UnifiedSettings"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const ApartmentBookingPage = lazy(() => import("./pages/ApartmentBooking"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const TenantManagement = lazy(() => import("./pages/TenantManagement"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
// VendorManagement consolidated into AdminManagementSystem
const VendorSubscription = lazy(() => import("./pages/VendorSubscription"));
const VendorPayments = lazy(() => import("./pages/VendorPayments"));
const JoinAsVendor = lazy(() => import("./pages/JoinAsVendor"));
// VendorMarketplace removed - access restricted
const RequestQuote = lazy(() => import("./pages/RequestQuote"));
const VendorLeads = lazy(() => import("./pages/vendor/VendorLeads"));
const VendorNotifications = lazy(() => import("./pages/vendor/VendorNotifications"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorApplication = lazy(() => import("./pages/VendorApplication"));
const VendorOnboarding = lazy(() => import("./pages/VendorOnboarding"));
const OnboardingLayout = lazy(() => import("./pages/vendor-onboarding/OnboardingLayout"));
const ProfileStep = lazy(() => import("./pages/vendor-onboarding/ProfileStep"));
const CompanyStep = lazy(() => import("./pages/vendor-onboarding/CompanyStep"));
const CapabilitiesStep = lazy(() => import("./pages/vendor-onboarding/CapabilitiesStep"));
const ComplianceStep = lazy(() => import("./pages/vendor-onboarding/ComplianceStep"));
const ReviewStep = lazy(() => import("./pages/vendor-onboarding/ReviewStep"));
const CompleteStep = lazy(() => import("./pages/vendor-onboarding/CompleteStep"));
// VendorRFQSystem, VendorVerificationSystem, AdminRFQSystem consolidated into RFQSystem.tsx and AdminManagementSystem
const VendorReports = lazy(() => import("./pages/VendorReports"));
const VendorProjects = lazy(() => import("./pages/VendorProjects"));
const VendorProjectDetails = lazy(() => import("./pages/VendorProjectDetails"));
const VendorApplications = lazy(() => import("./pages/VendorApplications"));
const VendorRFQ = lazy(() => import("./pages/VendorRFQ"));
const VendorContracts = lazy(() => import("./pages/VendorContracts"));
const VendorContractDetails = lazy(() => import("./pages/VendorContractDetails"));
const VendorDocuments = lazy(() => import("./pages/VendorDocuments"));
const VendorProfile = lazy(() => import("./pages/VendorProfile"));

const UserManagement = lazy(() => import("./pages/UserManagement"));
// Admin components consolidated into AdminManagementSystem
// AdminDashboard, AdminUserManagement, AdminVendorManagement, AdminSecurity, 
// AdminMonitoring, AdminProjectManagement all load inside AdminManagementSystem
const AdminTesting = lazy(() => import("@/pages/AdminTesting"));
// AdminPropertyManagement consolidated into AdminManagementSystem
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
// RFQSystem redirects to /admin/rfq, AdminSecurityTesting redirects to /admin/testing
const AdminTenants = lazy(() => import("./pages/AdminTenants"));
// AdminInvoices redirects to /admin?tab=payments
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminLabs = lazy(() => import("./pages/AdminLabs"));
const AdminControlSuite = lazy(() => import("./pages/AdminControlSuite"));
const DesignSystemShowcase = lazy(() => import("./pages/DesignSystemShowcase"));

// Phase 10 - RFQ Management Pages
const RFQManagement = lazy(() => import("./pages/admin/UnifiedRFQManagement"));
const RFQCreate = lazy(() => import("./pages/admin/RFQCreate"));
const RFQDetail = lazy(() => import("./pages/admin/ComprehensiveRFQDetail"));
const WorkOrders = lazy(() => import("./pages/admin/WorkOrders"));
const RFQEdit = lazy(() => import("./pages/admin/RFQEdit"));
const VendorRFQDashboard = lazy(() => import("./pages/vendor/VendorRFQDashboard"));
const VendorRFQDetail = lazy(() => import("./pages/vendor/ComprehensiveRFQDetail"));
const VendorPayouts = lazy(() => import("./pages/vendor/VendorPayouts"));
const VendorPayoutSettings = lazy(() => import("./pages/vendor/VendorPayoutSettings"));
const VendorInquiries = lazy(() => import("./pages/vendor/VendorInquiries"));
const VendorProfileShowcase = lazy(() => import("./pages/vendor/VendorProfileShowcase"));
const VendorMessages = lazy(() => import("./pages/vendor/VendorMessages"));

// Enhanced RFQ Pages
const RFQProjectDetail = lazy(() => import("./pages/RFQProjectDetail"));
const RFQBidSubmission = lazy(() => import("./pages/RFQBidSubmission"));

// Team Management & Vendor Showcase
const TeamManagement = lazy(() => import("./pages/admin/TeamManagement"));
const TeamMemberProfile = lazy(() => import("./pages/admin/TeamMemberProfile"));
const VendorShowcase = lazy(() => import("./pages/VendorShowcase"));
const ThemePreview = lazy(() => import("./pages/ThemePreview"));
const DesignTokens = lazy(() => import("./pages/admin/DesignTokens"));
const ComponentPlayground = lazy(() => import("./pages/admin/ComponentPlayground"));
const AdminPayoutProcessing = lazy(() => import("./pages/admin/AdminPayoutProcessing"));
const About = lazy(() => import("./pages/About"));

// QueryClient is provided by QueryProvider in main.tsx - no duplicate here

const App = () => (
  <>
    <SecurityHeaders />
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <OptimizedSecurityProvider enableRateLimit={true}>
            {/* AuthProvider is already in main.tsx - do not duplicate */}
            <Toaster />
            <BrowserRouter>
              <Suspense fallback={null}>
                <CommandPalette />
              </Suspense>
              <OptimizedLayout>
                <Suspense fallback={<LoadingSpinner minimal />}>
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/" element={<Index />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/apartments/:id" element={<ApartmentBookingPage />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/property-management" element={<PropertyManagement />} />
                <Route path="/services/consultation" element={<Consultation />} />
                <Route path="/services/maintenance" element={<Maintenance />} />
                
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/amenities" element={<Amenities />} />
                <Route path="/news" element={<News />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/verify" element={<AuthVerify />} />
                <Route path="/auth/callback" element={<LoginBridge />} />
                <Route path="/login-bridge" element={<LoginBridge />} />
                <Route path="/auth-debug" element={<AuthDebug />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/design-system" element={
                  <OptimizedProtectedRoute requiredRole="admin">
                    <DesignSystemShowcase />
                  </OptimizedProtectedRoute>
                } />
                
                {/* Public Vendor Pages - Marketplace Hidden */}
                <Route path="/join-as-vendor" element={<JoinAsVendor />} />
                {/* Vendor Marketplace route removed - access restricted */}
                <Route path="/request-quote" element={<RequestQuote />} />
                
                {/* Admin-only Sitemap - restricted access */}
                <Route path="/sitemap" element={
                  <OptimizedProtectedRoute requiredRole="admin">
                    <Sitemap />
                  </OptimizedProtectedRoute>
                } />
                
                {/* About Page - Phase 9B */}
                <Route path="/about" element={<About />} />
                {import.meta.env.DEV && (
                  <Route path="/auth-test" element={
                    <OptimizedProtectedRoute requiredRole="admin">
                      <AuthTest />
                    </OptimizedProtectedRoute>
                  } />
                )}
                
                {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <OptimizedProtectedRoute>
                <Dashboard />
              </OptimizedProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <OptimizedProtectedRoute>
                <UnifiedSettings />
              </OptimizedProtectedRoute>
            } />
                <Route path="/settings" element={
                  <OptimizedProtectedRoute>
                    <UnifiedSettings />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/dashboard/properties" element={
                  <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
                    <Properties />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/dashboard/tenants" element={
                  <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
                    <TenantManagement />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/dashboard/projects" element={
                  <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
                    <ProjectManagement />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/dashboard/projects/:id" element={
                  <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
                    <ProjectDetails />
                  </OptimizedProtectedRoute>
                } />
                {/* Redirect deprecated route */}
                <Route path="/dashboard/vendors" element={<Navigate to="/admin?tab=vendors" replace />} />
                <Route path="/dashboard/users" element={
                  <OptimizedProtectedRoute requiredRole="admin">
                    <UserManagement />
                  </OptimizedProtectedRoute>
                } />
                
                {/* Vendor Routes - All under /vendor/* */}
                <Route path="/vendor" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorDashboard />
                  </OptimizedProtectedRoute>
                } />
                {/* Redirect to primary vendor route */}
                <Route path="/vendor/dashboard" element={<Navigate to="/vendor" replace />} />
                <Route path="/vendor/projects" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorProjects />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/projects/:id" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorProjectDetails />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/applications" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorApplications />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/profile" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorProfile />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/rfq" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorRFQ />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/contracts" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorContracts />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/contracts/:id" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorContractDetails />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/payments" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorPayments />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/payouts" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorPayouts />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/payout-settings" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorPayoutSettings />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/reports" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorReports />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/documents" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorDocuments />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/settings" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <UnifiedSettings />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/subscription" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorSubscription />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/application" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorApplication />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/leads" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorLeads />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/notifications" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorNotifications />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
                <Route path="/vendor/inquiries" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorInquiries />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/profile-showcase" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorProfileShowcase />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/messages" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorMessages />
                  </OptimizedProtectedRoute>
                } />
                
                {/* Vendor Onboarding Multi-Step Wizard */}
                {/* Redirect base path to first step */}
                <Route path="/vendor-onboarding" element={<Navigate to="/vendor-onboarding/profile" replace />} />
                <Route path="/vendor-onboarding/profile" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <OnboardingLayout>
                      <ProfileStep />
                    </OnboardingLayout>
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor-onboarding/company" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <OnboardingLayout>
                      <CompanyStep />
                    </OnboardingLayout>
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor-onboarding/capabilities" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <OnboardingLayout>
                      <CapabilitiesStep />
                    </OnboardingLayout>
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor-onboarding/compliance" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <OnboardingLayout>
                      <ComplianceStep />
                    </OnboardingLayout>
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor-onboarding/review" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <OnboardingLayout>
                      <ReviewStep />
                    </OnboardingLayout>
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor-onboarding/complete" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <OnboardingLayout>
                      <CompleteStep />
                    </OnboardingLayout>
                  </OptimizedProtectedRoute>
                } />
                
                {/* Phase 10 - Vendor RFQ Routes */}
                <Route path="/vendor/rfq/dashboard" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorRFQDashboard />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/rfq/:id" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <VendorRFQDetail />
                  </OptimizedProtectedRoute>
                } />
                {/* Enhanced RFQ Detail and Bid Submission Routes */}
                <Route path="/vendor/rfq/:id/details" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <RFQProjectDetail />
                  </OptimizedProtectedRoute>
                } />
                <Route path="/vendor/rfq/:id/bid" element={
                  <OptimizedProtectedRoute requiredRole="vendor">
                    <RFQBidSubmission />
                  </OptimizedProtectedRoute>
                } />
                
                {/* Booking Routes */}
                <Route path="/book/:propertyId" element={<BookingPage />} />
                
                {/* Admin Routes - Consolidated */}
                <Route path="/admin" element={
                  <OptimizedProtectedRoute requiredRole="admin">
                    <AdminManagementSystem />
                  </OptimizedProtectedRoute>
                } />
                
                {/* Admin routes consolidated - use /admin?tab=<name> instead */}
              <Route path="/admin/testing" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <AdminTesting />
                </OptimizedProtectedRoute>
              } />
              {/* Redirect old routes to consolidated ones */}
              <Route path="/admin/security-testing" element={<Navigate to="/admin/testing" replace />} />
              <Route path="/admin/invoices" element={<Navigate to="/admin?tab=payments" replace />} />
              
              <Route path="/admin/tenants" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <AdminTenants />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/audit" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <AdminAuditLog />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/work-orders" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <WorkOrders />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/settings/labs" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <AdminLabs />
                </OptimizedProtectedRoute>
              } />
              {/* Rename control-suite to operations for clarity */}
              <Route path="/admin/operations" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <AdminControlSuite />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/control-suite" element={<Navigate to="/admin/operations" replace />} />
              
              {/* Team Management Routes */}
              <Route path="/admin/team" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <TeamManagement />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/team/:memberId" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <TeamMemberProfile />
                </OptimizedProtectedRoute>
              } />

              {/* Public Vendor Showcase */}
              <Route path="/vendors/:vendorId" element={<VendorShowcase />} />

              {/* Phase 10 - Admin RFQ Routes */}
              <Route path="/admin/rfq" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <RFQManagement />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/rfq/create" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <RFQCreate />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/rfq/:id" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <RFQDetail />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/rfq/:id/edit" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <RFQEdit />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/rfq/create-detailed" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <RFQEdit />
                </OptimizedProtectedRoute>
              } />
              
              {/* Redirect deprecated RFQ system route */}
              <Route path="/rfq-system" element={<Navigate to="/admin/rfq" replace />} />
              
              {/* Design System Preview - Admin only */}
              <Route path="/theme-preview" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <ThemePreview />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/design-tokens" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <DesignTokens />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/component-playground" element={
                <OptimizedProtectedRoute requiredRole="admin">
              <ComponentPlayground />
                </OptimizedProtectedRoute>
              } />
              <Route path="/admin/payouts" element={
                <OptimizedProtectedRoute requiredRole="admin">
                  <AdminPayoutProcessing />
                </OptimizedProtectedRoute>
              } />
                  
                          {/* Catch all route */}
                          <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </OptimizedLayout>
            
            {/* WhatsApp Floating Button - Global */}
            <WhatsAppFloatingButton />
          </BrowserRouter>
        </OptimizedSecurityProvider>
      </TooltipProvider>
    </LanguageProvider>
  </ThemeProvider>
</>

);

export default App;

