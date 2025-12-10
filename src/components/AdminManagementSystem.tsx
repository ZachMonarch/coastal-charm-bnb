import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboardContent from "@/components/AdminDashboardContent";
import AdminPropertyManagement from "@/components/AdminPropertyManagement";
import AdminVendorInvite from "@/components/AdminVendorInvite";
import VendorVerificationSystem from "@/components/VendorVerificationSystem";
import AdminRFQSystem from "@/components/AdminRFQSystem";
import EnhancedPaymentManagement from "@/components/admin/EnhancedPaymentManagement";
import AdminUserManagement from "@/pages/AdminUserManagement";
import AdminTesting from "@/pages/AdminTesting";
import NewsAdminPanel from "@/components/admin/NewsAdminPanel";
import AdminBidManagement from "@/components/admin/AdminBidManagement";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Building, Users, UserPlus, FileText, Shield, BarChart3, CreditCard, Newspaper, UsersRound, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";

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
    { value: 'news', icon: Newspaper, label: 'News', color: 'text-info' },
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
              <AdminDashboardContent />
            </TabsContent>
            
            <TabsContent value="properties" className="animate-fade-in">
              <AdminPropertyManagement />
            </TabsContent>
            
            <TabsContent value="vendors" className="animate-fade-in">
              <AdminVendorInvite />
            </TabsContent>
            
            <TabsContent value="projects" className="animate-fade-in">
              <AdminRFQSystem />
            </TabsContent>

            <TabsContent value="bids" className="animate-fade-in">
              <AdminBidManagement />
            </TabsContent>

            <TabsContent value="payments" className="animate-fade-in">
              <EnhancedPaymentManagement />
            </TabsContent>

            <TabsContent value="news" className="animate-fade-in">
              <NewsAdminPanel />
            </TabsContent>
            
            <TabsContent value="verification" className="animate-fade-in">
              <VendorVerificationSystem />
            </TabsContent>

            <TabsContent value="testing" className="animate-fade-in">
              <AdminTesting />
            </TabsContent>
            
            <TabsContent value="users" className="animate-fade-in">
              <AdminUserManagement />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </EnhancedPageBackground>
  );
}
