import { useState, useEffect } from "react";
import { Plus, Search, User, Home, DollarSign, Calendar, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { getStatusColor } from '@/utils/themeColors';
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  unit: string;
  property: string;
  rent: number;
  status: string;
  leaseStart: string;
  leaseEnd: string;
  avatar: string | null;
}

export default function TenantManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // Fetch profiles with tenant role
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url, status, created_at')
          .eq('role', 'tenant')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching tenants:', error);
          setTenants([]);
          return;
        }

        // Map to our tenant interface
        const mappedTenants: Tenant[] = (data || []).map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unknown',
          email: profile.email,
          phone: profile.phone,
          unit: 'N/A', // Would come from a lease/booking table
          property: 'N/A', // Would come from a lease/booking table
          rent: 0, // Would come from a lease/booking table
          status: profile.status === 'active' ? 'Current' : profile.status || 'Unknown',
          leaseStart: profile.created_at,
          leaseEnd: '',
          avatar: profile.avatar_url
        }));

        setTenants(mappedTenants);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || tenant.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalTenants = tenants.length;
  const currentTenants = tenants.filter(t => t.status === "Current").length;
  const monthlyRevenue = tenants.filter(t => t.status === "Current").reduce((sum, t) => sum + t.rent, 0);
  const latePayments = tenants.filter(t => t.status === "Late Payment").length;

  return (
    <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <PageHero
          title="Tenant Management"
          description="Manage all tenants and lease agreements across your properties"
          icon={User}
          variant="gradient"
          actions={[
            { label: "Add Tenant", href: "/dashboard/tenants/new" }
          ]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tenants"
            value={totalTenants}
            icon={User}
            color="primary"
            subtitle="All tenants"
          />
          <StatsCard
            title="Current Tenants"
            value={currentTenants}
            icon={Home}
            color="success"
            subtitle="Active leases"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="info"
            subtitle="From current tenants"
          />
          <StatsCard
            title="Late Payments"
            value={latePayments}
            icon={Calendar}
            color="warning"
            subtitle="Requires attention"
          />
        </div>

        {/* Filters */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants, units, or properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["All", "Current", "Notice Given", "Late Payment", "Former"].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenants Table */}
        <Card variant="interactive">
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>All tenants across your properties</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading tenants...</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tenants found</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/tenants/${tenant.id}`)}
                >
                  <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <Avatar>
                      <AvatarImage src={tenant.avatar} />
                      <AvatarFallback>{tenant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.email}</p>
                      <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <div className="text-sm">
                      <div className="font-medium">Unit {tenant.unit}</div>
                      <div className="text-muted-foreground">{tenant.property}</div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium">${tenant.rent}/month</div>
                      <div className="text-muted-foreground">Lease: {tenant.leaseStart} - {tenant.leaseEnd}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/tenants/${tenant.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/tenants/${tenant.id}/edit`)}>
                            Edit Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Send Notice
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Payment History
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Terminate Lease
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EnhancedPageBackground>
  );
}