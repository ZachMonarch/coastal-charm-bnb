import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench, Plus, Calendar, Clock, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaintenanceRequest {
  id: string;
  property_id: string;
  property_name: string;
  tenant_id: string | null;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'general' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  // Fetched via JOIN with profiles
  profiles?: {
    full_name: string | null;
    email: string;
  };
  assigned_vendor_id?: string;
  assigned_vendor_name?: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  completed_date?: string;
  cost_estimate?: number;
  actual_cost?: number;
  images?: string[];
  notes?: string;
}

export const MaintenanceRequestPortal: React.FC = () => {
  const { user, hasRole, hasPermission } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<MaintenanceRequest>>({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    property_id: '',
    property_name: ''
  });

  useEffect(() => {
    fetchMaintenanceRequests();
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch real maintenance requests from the database
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('id, property_id, property_name, tenant_id, title, description, category, priority, status, assigned_vendor_id, assigned_vendor_name, created_at, updated_at, scheduled_date, completed_date, cost_estimate, actual_cost, images, notes')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching maintenance requests:', error);
        toast.error('Failed to load maintenance requests');
        setRequests([]);
        return;
      }

      // Map database results to our interface
      const mappedRequests: MaintenanceRequest[] = (data || []).map(req => ({
        id: req.id,
        property_id: req.property_id,
        property_name: req.property_name,
        tenant_id: req.tenant_id,
        title: req.title,
        description: req.description,
        category: req.category as MaintenanceRequest['category'],
        priority: req.priority as MaintenanceRequest['priority'],
        status: req.status as MaintenanceRequest['status'],
        assigned_vendor_id: req.assigned_vendor_id || undefined,
        assigned_vendor_name: req.assigned_vendor_name || undefined,
        created_at: req.created_at,
        updated_at: req.updated_at,
        scheduled_date: req.scheduled_date || undefined,
        completed_date: req.completed_date || undefined,
        cost_estimate: req.cost_estimate || undefined,
        actual_cost: req.actual_cost || undefined,
        images: req.images || undefined,
        notes: req.notes || undefined
      }));

      setRequests(mappedRequests);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast.error('Failed to load maintenance requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    try {
      const requestData = {
        ...newRequest,
        id: Math.random().toString(36).substr(2, 9),
        tenant_id: user?.id || null,
        status: 'submitted' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In real implementation, save to database
      setRequests([requestData as MaintenanceRequest, ...requests]);
      setIsCreateDialogOpen(false);
      setNewRequest({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        property_id: '',
        property_name: ''
      });
      toast.success('Maintenance request submitted successfully');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit maintenance request');
    }
  };

  const updateRequestStatus = async (requestId: string, status: MaintenanceRequest['status']) => {
    try {
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status, 
              updated_at: new Date().toISOString(),
              completed_date: status === 'completed' ? new Date().toISOString() : req.completed_date
            } 
          : req
      ));
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    }
  };

  const assignVendor = async (requestId: string, vendorName: string) => {
    try {
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'assigned' as const,
              assigned_vendor_name: vendorName,
              updated_at: new Date().toISOString()
            } 
          : req
      ));
      toast.success('Vendor assigned successfully');
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    }
  };

  const getPriorityColor = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'default';
      case 'emergency': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'assigned': return 'default';
      case 'in_progress': return 'outline'; // Using outline instead of warning
      case 'completed': return 'default'; // Using default instead of success
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: MaintenanceRequest['category']) => {
    switch (category) {
      case 'plumbing': return '🔧';
      case 'electrical': return '⚡';
      case 'hvac': return '❄️';
      case 'emergency': return '🚨';
      default: return '🏠';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Requests</h2>
          <p className="text-muted-foreground">
            {hasRole('tenant') ? 'Submit and track your maintenance requests' : 'Manage property maintenance requests'}
          </p>
        </div>
        
        {(hasRole('tenant') || hasPermission('*')) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Maintenance Request</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_name">Property</Label>
                    <Input
                      id="property_name"
                      value={newRequest.property_name}
                      onChange={(e) => setNewRequest({...newRequest, property_name: e.target.value})}
                      placeholder="Enter property address or unit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newRequest.category} onValueChange={(value) => setNewRequest({...newRequest, category: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">🔧 Plumbing</SelectItem>
                        <SelectItem value="electrical">⚡ Electrical</SelectItem>
                        <SelectItem value="hvac">❄️ HVAC</SelectItem>
                        <SelectItem value="general">🏠 General</SelectItem>
                        <SelectItem value="emergency">🚨 Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({...newRequest, priority: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Issue Title</Label>
                    <Input
                      id="title"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                      placeholder="Brief description of the issue"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    placeholder="Please provide detailed information about the maintenance issue..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitRequest}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {requests.filter(r => r.status === 'submitted').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-info">
                  {requests.filter(r => ['assigned', 'in_progress'].includes(r.status)).length}
                </p>
              </div>
              <User className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading maintenance requests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {request.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.property_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.profiles?.full_name || 'Tenant'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(request.category)}</span>
                        <span className="capitalize">{request.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(request.priority)}>
                        {request.priority === 'emergency' && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.assigned_vendor_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {hasPermission('manage_maintenance') && (
                          <>
                            {request.status === 'submitted' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => assignVendor(request.id, 'Available Vendor')}
                              >
                                Assign
                              </Button>
                            )}
                            {request.status === 'assigned' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateRequestStatus(request.id, 'in_progress')}
                              >
                                Start Work
                              </Button>
                            )}
                            {request.status === 'in_progress' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateRequestStatus(request.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};