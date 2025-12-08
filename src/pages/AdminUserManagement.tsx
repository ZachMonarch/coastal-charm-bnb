import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Shield, User, Crown, Edit, Trash, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { getRoleBadgeColor, getStatusColor } from "@/utils/themeColors";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  phone?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('profile_changes_admin')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Profile changed:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status, created_at, updated_at, phone, city, state, avatar_url')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .rpc('assign_user_role', {
          target_user_id: userId,
          new_role: newRole
        });

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success('User role updated successfully');
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      toast.success('User status updated successfully');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'property_manager': return <Shield className="h-4 w-4" />;
      case 'vendor': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <PrivatePageWrapper title="User Management">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-info/5">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Hero Section */}
          <PageHero
            title="User Management"
            description="Manage users, roles, and permissions across your organization"
            icon={Users}
            variant="gradient"
            actions={[
              { label: 'Refresh Data', href: '#', variant: 'outline' },
              { label: 'Add User', href: '#', variant: 'default' },
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Users"
              value={users.length}
              icon={User}
              color="info"
            />
            <StatsCard
              title="Active Users"
              value={users.filter(u => u.status === 'active').length}
              icon={UserCheck}
              color="success"
            />
            <StatsCard
              title="Admins"
              value={users.filter(u => u.role === 'admin').length}
              icon={Crown}
              color="warning"
            />
            <StatsCard
              title="Vendors"
              value={users.filter(u => u.role === 'vendor').length}
              icon={Shield}
              color="secondary"
            />
          </div>

          {/* Filters */}
          <Card variant="glass" className="border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="property_manager">Property Manager</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card variant="interactive" className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-info/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-info animate-pulse" />
                Users
              </CardTitle>
              <CardDescription>
                {filteredUsers.length} users found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className="hover:bg-muted/50 transition-colors border-l-2 border-l-transparent hover:border-l-primary"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role || 'tenant'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active')}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          {editingUser && (
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
              <DialogContent className="bg-gradient-to-br from-card to-card/95">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user role and permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select 
                      value={editingUser.role} 
                      onValueChange={(value) => updateUserRole(editingUser.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="property_manager">Property Manager</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      value={editingUser.status} 
                      onValueChange={(value) => updateUserStatus(editingUser.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </PrivatePageWrapper>
  );
}
