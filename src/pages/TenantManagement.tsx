import { useState } from "react";
import { Plus, Search, User, Home, DollarSign, Calendar, MoreHorizontal } from "lucide-react";
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

// Mock tenant data
const mockTenants = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "+1 (555) 234-5678",
    unit: "A101",
    property: "Downtown Apartments",
    rent: 1200,
    status: "Current",
    leaseStart: "2023-06-01",
    leaseEnd: "2024-05-31",
    avatar: "/placeholder.svg",
    emergencyContact: "Bob Johnson - (555) 345-6789"
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "+1 (555) 345-6789",
    unit: "B205",
    property: "Riverside Complex",
    rent: 1350,
    status: "Current",
    leaseStart: "2023-08-15",
    leaseEnd: "2024-08-14",
    avatar: "/placeholder.svg",
    emergencyContact: "Linda Chen - (555) 456-7890"
  },
  {
    id: "3",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    phone: "+1 (555) 456-7890",
    unit: "C302",
    property: "Garden View",
    rent: 1100,
    status: "Notice Given",
    leaseStart: "2023-04-01",
    leaseEnd: "2024-03-31",
    avatar: "/placeholder.svg",
    emergencyContact: "Tom Williams - (555) 567-8901"
  },
  {
    id: "4",
    name: "David Martinez",
    email: "david.martinez@example.com",
    phone: "+1 (555) 567-8901",
    unit: "D401",
    property: "Sunset Heights",
    rent: 1450,
    status: "Late Payment",
    leaseStart: "2023-09-01",
    leaseEnd: "2024-08-31",
    avatar: "/placeholder.svg",
    emergencyContact: "Maria Martinez - (555) 678-9012"
  }
];

export default function TenantManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const navigate = useNavigate();

  const filteredTenants = mockTenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || tenant.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalTenants = mockTenants.length;
  const currentTenants = mockTenants.filter(t => t.status === "Current").length;
  const monthlyRevenue = mockTenants.filter(t => t.status === "Current").reduce((sum, t) => sum + t.rent, 0);
  const latePayments = mockTenants.filter(t => t.status === "Late Payment").length;

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
          </CardContent>
        </Card>
      </div>
    </EnhancedPageBackground>
  );
}