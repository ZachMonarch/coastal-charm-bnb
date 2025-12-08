import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, User, Mail, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { getRoleBadgeColor, getStatusColor } from '@/utils/themeColors';

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2024-01-15",
    avatar: "/placeholder.svg",
    properties: 12,
    tenants: 45
  },
  {
    id: "2", 
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "Property Manager",
    status: "Active",
    lastLogin: "2024-01-14",
    avatar: "/placeholder.svg",
    properties: 8,
    tenants: 32
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@example.com", 
    role: "Tenant",
    status: "Active",
    lastLogin: "2024-01-13",
    avatar: "/placeholder.svg",
    properties: 0,
    tenants: 0
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "Vendor",
    status: "Pending",
    lastLogin: "2024-01-12",
    avatar: "/placeholder.svg",
    properties: 0,
    tenants: 0
  }
];

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const navigate = useNavigate();

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });


  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-muted-foreground">Manage all users, roles, and permissions</p>
          </div>
          <Button onClick={() => navigate('/dashboard/users/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Admin", "Property Manager", "Tenant", "Vendor"].map((role) => (
              <Button
                key={role}
                variant={selectedRole === role ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRole(role)}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUsers.length}</div>
            </CardContent>
          </Card>
          
          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.status === "Active").length}</div>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === "Admin").length}</div>
            </CardContent>
          </Card>

          <Card className="neumorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Property Managers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === "Property Manager").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>All registered users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/users/${user.id}`)}
                >
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last login: {user.lastLogin}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Badge className={getRoleBadgeColor(user.role.toLowerCase().replace(' ', '_'))}>{user.role}</Badge>
                    <Badge className={getStatusColor(user.status.toLowerCase())}>{user.status}</Badge>
                    
                    {user.role === "Property Manager" && (
                      <div className="text-xs text-muted-foreground">
                        {user.properties} properties, {user.tenants} tenants
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/users/${user.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/users/${user.id}/edit`)}>
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Deactivate User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}