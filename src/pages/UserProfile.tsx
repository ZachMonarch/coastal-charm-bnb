import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Building, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoleBadgeColor, getStatusColor } from '@/utils/themeColors';
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import StatsCard from "@/components/shared/StatsCard";

// Mock user data
const mockUserData = {
  "1": {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    role: "Admin",
    status: "Active",
    joinDate: "2023-03-15",
    lastLogin: "2024-01-15",
    avatar: "/placeholder.svg",
    address: "123 Business St, City, State 12345",
    properties: [
      { id: "1", name: "Downtown Apartments", units: 24, occupied: 22 },
      { id: "2", name: "Riverside Complex", units: 18, occupied: 16 }
    ],
    tenants: [
      { id: "1", name: "Alice Johnson", unit: "A101", rent: 1200, status: "Current" },
      { id: "2", name: "Bob Wilson", unit: "B205", rent: 1350, status: "Current" }
    ],
    recentActivity: [
      { date: "2024-01-15", action: "Approved maintenance request #142" },
      { date: "2024-01-14", action: "Updated property listing for Downtown Apartments" },
      { date: "2024-01-13", action: "Responded to tenant inquiry" }
    ]
  }
};

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  const userData = mockUserData[id as keyof typeof mockUserData];

  if (!userData) {
    return (
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <Button onClick={() => navigate('/dashboard/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </EnhancedPageBackground>
    );
  }

  return (
    <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard/users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-muted-foreground">View and manage user details</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/dashboard/users/${id}/edit`)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit User
          </Button>
        </div>

        {/* User Header Card */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="text-2xl">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold">{userData.name}</h2>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(userData.role.toLowerCase().replace(' ', '_'))}>{userData.role}</Badge>
                    <Badge className={getStatusColor(userData.status.toLowerCase())}>{userData.status}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{userData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined: {userData.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>Last login: {userData.lastLogin}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{userData.address}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StatsCard
                title="Properties Managed"
                value={userData.properties.length}
                icon={Building}
                color="primary"
                subtitle="Total properties"
              />
              <StatsCard
                title="Tenants"
                value={userData.tenants.length}
                icon={Users}
                color="success"
                subtitle="Active tenants"
              />
              <StatsCard
                title="Activity Score"
                value="98%"
                icon={Activity}
                color="info"
                subtitle="Response rate"
              />
            </div>
          </TabsContent>

          <TabsContent value="properties">
            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Managed Properties</CardTitle>
                <CardDescription>Properties under this user's management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userData.properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/properties/${property.id}`)}
                    >
                      <div>
                        <h3 className="font-medium">{property.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {property.occupied}/{property.units} units occupied
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round((property.occupied / property.units) * 100)}% occupied
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {property.units} total units
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Tenants</CardTitle>
                <CardDescription>Tenants under this user's management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userData.tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/tenants/${tenant.id}`)}
                    >
                      <div>
                        <h3 className="font-medium">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">Unit {tenant.unit}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${tenant.rent}/month</div>
                        <Badge className={getStatusColor(tenant.status.toLowerCase())}>{tenant.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedPageBackground>
  );
}