import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Building, Users, UserPlus, FileText, Shield, BarChart3, CreditCard, Newspaper, UsersRound, Gavel, Bell, MessageSquare, Mail, UserCheck } from "lucide-react";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all admin sub-components to reduce initial bundle size
const AdminDashboardContent = lazy(() => import("@/components/AdminDashboardContent"));
const AdminPropertyManagement = lazy(() => import("@/components/AdminPropertyManagement"));
const AdminVendorManagement = lazy(() => import("@/components/AdminVendorManagement"));
const VendorVerificationSystem = lazy(() => import("@/components/VendorVerificationSystem"));
const AdminRFQSystem = lazy(() => import("@/components/AdminRFQSystem"));
const EnhancedPaymentManagement = lazy(() => import("@/components/admin/EnhancedPaymentManagement"));
const AdminUserManagement = lazy(() => import("@/pages/AdminUserManagement"));
const AdminTesting = lazy(() => import("@/pages/AdminTesting"));
const NewsAdminPanel = lazy(() => import("@/components/admin/NewsAdminPanel"));
const AdminBidManagement = lazy(() => import("@/components/admin/AdminBidManagement"));
const AdminNotificationCenter = lazy(() => import("@/components/admin/AdminNotificationCenter"));
const AdminInquiryManagement = lazy(() => import("@/components/admin/AdminInquiryManagement"));
const EmailTemplateManager = lazy(() => import("@/components/admin/EmailTemplateManager"));
const NewsletterManagement = lazy(() => import("@/components/admin/NewsletterManagement"));
const UserApprovalQueue = lazy(() => import("@/components/admin/UserApprovalQueue"));
const AdminMessages = lazy(() => import("@/components/admin/AdminMessages"));

// Loading fallback for tab content
const TabContentSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

export default function AdminManagementSystem() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'dashboard';

  const handleTabChange = (value: string) => {
    if (value === 'team') {
      navigate('/admin/team');
      return;
    }
    setSearchParams({ tab: value });
  };

  const tabItems = [
    { value: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-primary' },
    { value: 'properties', icon: Building, label: 'Properties', color: 'text-info' },
    { value: 'vendors', icon: UserPlus, label: 'Vendors', color: 'text-success' },
    { value: 'team', icon: UsersRound, label: 'Team', color: 'text-secondary' },
    { value: 'projects', icon: FileText, label: 'Projects', color: 'text-warning' },
    { value: 'bids', icon: Gavel, label: 'Bids', color: 'text-primary' },
    { value: 'payments', icon: CreditCard, label: 'Payments', color: 'text-success' },
    { value: 'notifications', icon: Bell, label: 'Notifications', color: 'text-warning' },
    { value: 'inquiries', icon: MessageSquare, label: 'Inquiries', color: 'text-info' },
    { value: 'messages', icon: MessageSquare, label: 'Messages', color: 'text-primary' },
    { value: 'news', icon: Newspaper, label: 'News', color: 'text-info' },
    { value: 'templates', icon: Mail, label: 'Templates', color: 'text-secondary' },
    { value: 'newsletter', icon: Newspaper, label: 'Newsletter', color: 'text-info' },
    { value: 'approvals', icon: UserCheck, label: 'Approvals', color: 'text-warning' },
    { value: 'verification', icon: Shield, label: 'Verify', color: 'text-warning' },
    { value: 'testing', icon: Shield, label: 'Testing', color: 'text-muted-foreground' },
    { value: 'users', icon: Users, label: 'Users', color: 'text-info' },
  ];

  return (
    <EnhancedPageBackground gradient="linear" pattern="dots" className="min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <PageHero
          title="Admin Control Center"
          description="Manage your properties, vendors, users, and system settings"
          icon={Shield}
          variant="gradient"
        />

        <Tabs value={defaultTab} onValueChange={handleTabChange} className="w-full">
          {/* Enhanced Tab List with colorful styling */}
          <div className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 rounded-xl p-2 border border-border/50 shadow-sm">
            <TabsList variant="pills" className="flex-wrap">
              {tabItems.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  variant="pills"
                >
                  <tab.icon className={`h-4 w-4 ${tab.color}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <div className="mt-6">
            <TabsContent value="dashboard" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminDashboardContent />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="properties" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminPropertyManagement />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="vendors" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminVendorManagement />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="projects" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminRFQSystem />
              </Suspense>
            </TabsContent>

            <TabsContent value="bids" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminBidManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="payments" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <EnhancedPaymentManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="notifications" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminNotificationCenter />
              </Suspense>
            </TabsContent>

            <TabsContent value="inquiries" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminInquiryManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="news" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <NewsAdminPanel />
              </Suspense>
            </TabsContent>

            <TabsContent value="templates" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <EmailTemplateManager />
              </Suspense>
            </TabsContent>

            <TabsContent value="newsletter" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <NewsletterManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="messages" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminMessages />
              </Suspense>
            </TabsContent>

            <TabsContent value="approvals" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <UserApprovalQueue />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="verification" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <VendorVerificationSystem />
              </Suspense>
            </TabsContent>

            <TabsContent value="testing" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminTesting />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="users" className="animate-fade-in">
              <Suspense fallback={<TabContentSkeleton />}>
                <AdminUserManagement />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </EnhancedPageBackground>
  );
}
