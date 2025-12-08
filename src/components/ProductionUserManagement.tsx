import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { logger } from '@/utils/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReusableAvatar from "./Avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Shield, Search, Filter, MoreVertical, Plus, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { getRoleBadgeColor, getStatusColor } from "@/utils/themeColors";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  avatar_url: string | null;
  created_at: string;
  last_sign_in?: string;
  phone?: string | null;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  vendors: number;
  tenants: number;
  propertyManagers: number;
}

export default function ProductionUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    vendors: 0,
    tenants: 0,
    propertyManagers: 0,
  });
  const { user } = useAuth();

  // Fetch users and calculate stats
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch user profiles with role information
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          avatar_url,
          created_at,
          phone
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);

      // Calculate stats
      const total = profiles?.length || 0;
      const active = profiles?.filter(p => p.status === 'active').length || 0;
      const inactive = total - active;
      const admins = profiles?.filter(p => p.role === 'admin').length || 0;
      const vendors = profiles?.filter(p => p.role === 'vendor').length || 0;
      const tenants = profiles?.filter(p => p.role === 'tenant').length || 0;
      const propertyManagers = profiles?.filter(p => p.role === 'property_manager').length || 0;

      setStats({
        total,
        active,
        inactive,
        admins,
        vendors,
        tenants,
        propertyManagers,
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Real-time subscription for profile changes
    const channel = supabase
      .channel('profile_changes_production')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          logger.debug('Profile changed:', payload);
          fetchUsers(); // Refresh users list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User status updated to ${newStatus}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      logger.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
          granted_by: user?.id,
          granted_at: new Date().toISOString()
        });

      if (roleError) throw roleError;

      toast.success(`User role updated to ${newRole}`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      logger.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesRole = selectedRole === "All" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "All" || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>
        
        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendors}</div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Managers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propertyManagers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="neumorphic-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="property_manager">Property Manager</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <ReusableAvatar 
                        url={user.avatar_url}
                        name={user.full_name || user.email}
                        size="md"
                        variant="user"
                      />
                      <div>
                        <div className="font-medium">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}>
                          {user.status === 'active' ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, 'admin')}>
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, 'vendor')}>
                          Make Vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, 'property_manager')}>
                          Make Property Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, 'tenant')}>
                          Make Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}