import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Wrench, Calendar, User, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHero from '@/components/shared/PageHero';
import StatsCard from '@/components/shared/StatsCard';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to?: string;
  property_id?: number;
  created_at: string;
  scheduled_date?: string;
}

export default function WorkOrders() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    property_id: '',
    due_date: '',
  });

  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, description, status, priority, property_id, assigned_to, tenant_id, created_at, updated_at, scheduled_date, completed_date, contract_id, created_by')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WorkOrder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('work_orders').insert({
        title: data.title,
        description: data.description,
        priority: data.priority,
        property_id: data.property_id ? parseInt(data.property_id) : null,
        scheduled_date: data.due_date || null,
        status: 'pending',
        created_by: (await supabase.auth.getUser()).data.user?.id,
        tenant_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Work order created');
      setOpen(false);
      setFormData({ title: '', description: '', priority: 'medium', property_id: '', due_date: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create work order: ${error.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('work_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Status updated');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'low':
        return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'in_progress':
        return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Stats calculations
  const pendingCount = workOrders?.filter(o => o.status === 'pending').length || 0;
  const inProgressCount = workOrders?.filter(o => o.status === 'in_progress').length || 0;
  const completedCount = workOrders?.filter(o => o.status === 'completed').length || 0;
  const highPriorityCount = workOrders?.filter(o => o.priority === 'high').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Hero Section */}
        <PageHero
          title="Work Orders"
          description="Manage maintenance and service requests efficiently"
          icon={Wrench}
          variant="gradient"
          actions={[
            { label: 'Create Work Order', href: '#', variant: 'default' },
          ]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Orders"
            value={workOrders?.length || 0}
            icon={FileText}
            color="info"
          />
          <StatsCard
            title="Pending"
            value={pendingCount}
            icon={Clock}
            color="warning"
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount}
            icon={Wrench}
            color="info"
          />
          <StatsCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle}
            color="success"
          />
        </div>

        {/* High Priority Alert */}
        {highPriorityCount > 0 && (
          <Card variant="warning" className="animate-fade-in">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/20">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-warning">High Priority Items</p>
                <p className="text-sm text-muted-foreground">
                  {highPriorityCount} work order{highPriorityCount !== 1 ? 's' : ''} require immediate attention
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="ml-auto bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/30 border-2 border-primary/50">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Work Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gradient-to-br from-card to-card/95">
                  <DialogHeader>
                    <DialogTitle>Create New Work Order</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="property_id">Property ID</Label>
                      <Input
                        id="property_id"
                        type="number"
                        value={formData.property_id}
                        onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full shadow-md" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create Work Order'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Create Button (when no high priority) */}
        {highPriorityCount === 0 && (
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/30 border-2 border-primary/50">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Work Order
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-card to-card/95">
                <DialogHeader>
                  <DialogTitle>Create New Work Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="property_id">Property ID</Label>
                    <Input
                      id="property_id"
                      type="number"
                      value={formData.property_id}
                      onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-md" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Work Order'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Work Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : workOrders?.length === 0 ? (
          <Card variant="gradient" className="py-12">
            <CardContent className="text-center">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No work orders found</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first work order to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workOrders?.map((order, index) => (
              <Card 
                key={order.id} 
                variant="interactive"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{order.title}</CardTitle>
                      <CardDescription className="mt-2">{order.description}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {order.scheduled_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(order.scheduled_date).toLocaleDateString()}
                      </div>
                    )}
                    {order.assigned_to && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Assigned
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'in_progress' })}
                      disabled={order.status === 'in_progress'}
                      className="border-2 border-info/30 hover:border-info hover:bg-info/10 text-info shadow-sm"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'completed' })}
                      disabled={order.status === 'completed'}
                      className="border-2 border-success/30 hover:border-success hover:bg-success/10 text-success shadow-sm"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
