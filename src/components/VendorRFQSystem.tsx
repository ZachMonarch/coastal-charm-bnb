import React, { useState } from 'react';
import { Plus, Search, Calendar, DollarSign, MapPin, Clock, CheckCircle2, AlertCircle, Building, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useVendorApplications } from '@/hooks/useVendors';
import VendorBidForm from './rfq/VendorBidForm';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface RFQProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string;
  category: string | null;
  property_id: number | null;
  created_at: string;
  property?: {
    title: string | null;
    address: string | null;
    city: string | null;
  } | null;
  lots: Array<{
    id: string;
    lot_name: string;
    quantity: number;
    unit_of_measure: string;
    specifications: any;
  }>;
  inviteStatus: string;
}

export default function VendorRFQSystem() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const { applications, loading: applicationsLoading, refetch: refetchApplications } = useVendorApplications({ userId: user?.id });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQProject | null>(null);

  const canApplyToProjects = user?.role === 'vendor' && isSubscribed('basic');
  const canViewAllProjects = user?.role === 'vendor' && isSubscribed('premium');

  // Fetch real RFQ invitations for current vendor
  const { data: rfqProjects = [], isLoading, error } = useQuery({
    queryKey: ['vendor-rfq-invites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all RFQ invites for this vendor
      const { data: invites, error: invitesError } = await supabase
        .from('rfq_invites')
        .select(`
          id,
          status,
          rfq_id,
          invited_at
        `)
        .eq('vendor_id', user.id)
        .order('invited_at', { ascending: false });

      if (invitesError) {
        console.error('Error fetching invites:', invitesError);
        throw invitesError;
      }

      if (!invites || invites.length === 0) return [];

      // Get RFQ details for each invite
      const rfqIds = invites.map(inv => inv.rfq_id);
      
      const { data: rfqs, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          id,
          title,
          description,
          status,
          deadline,
          category,
          property_id,
          created_at
        `)
        .in('id', rfqIds);

      if (rfqError) {
        console.error('Error fetching RFQs:', rfqError);
        throw rfqError;
      }

      // Get property details
      const propertyIds = rfqs?.map(r => r.property_id).filter(Boolean) || [];
      let propertiesMap: Record<number, any> = {};
      
      if (propertyIds.length > 0) {
        const { data: properties } = await supabase
          .from('properties')
          .select('id, title, address, city')
          .in('id', propertyIds);
        
        if (properties) {
          propertiesMap = properties.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
      }

      // Get lots for each RFQ
      const { data: allLots } = await supabase
        .from('rfq_lots')
        .select('id, rfq_id, lot_name, quantity, unit_of_measure, specifications')
        .in('rfq_id', rfqIds);

      const lotsMap = (allLots || []).reduce((acc, lot) => {
        if (!acc[lot.rfq_id]) acc[lot.rfq_id] = [];
        acc[lot.rfq_id].push(lot);
        return acc;
      }, {} as Record<string, any[]>);

      // Combine all data
      return (rfqs || []).map(rfq => {
        const invite = invites.find(inv => inv.rfq_id === rfq.id);
        return {
          ...rfq,
          property: rfq.property_id ? propertiesMap[rfq.property_id] : null,
          lots: lotsMap[rfq.id] || [],
          inviteStatus: invite?.status || 'invited'
        };
      }) as RFQProject[];
    },
    enabled: !!user?.id
  });

  const filteredProjects = rfqProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (project.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-success bg-success/10 border-success/30';
      case 'awarded': return 'text-primary bg-primary/10 border-primary/30';
      case 'closed': return 'text-muted-foreground bg-muted border-border';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'HVAC': 'text-info bg-info/10 border-info/30',
      'Plumbing': 'text-primary bg-primary/10 border-primary/30',
      'Electrical': 'text-warning bg-warning/10 border-warning/30',
      'Landscaping': 'text-success bg-success/10 border-success/30',
      'Maintenance': 'text-muted-foreground bg-muted border-border',
      'General': 'text-secondary bg-secondary/10 border-secondary/30'
    };
    return colors[category || ''] || 'text-muted-foreground bg-muted border-border';
  };

  const formatDeadline = (deadline: string) => {
    try {
      return format(new Date(deadline), 'MMM dd, yyyy');
    } catch {
      return deadline;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">RFQ Opportunities</h1>
          <p className="text-muted-foreground">Browse and bid on available Request for Quotations</p>
        </div>

        {/* Subscription Status Alert */}
        {!canApplyToProjects && (
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-warning" />
                <div>
                  <h3 className="font-semibold text-foreground">Subscription Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Basic plan or higher to submit bids on RFQs.
                  </p>
                </div>
                <Button asChild className="ml-auto">
                  <Link to="/dashboard/subscription">Upgrade Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">Your RFQ Invitations</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isLoading ? 'Loading...' : `${filteredProjects.length} RFQ invitation${filteredProjects.length !== 1 ? 's' : ''} available`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs, properties, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background text-foreground placeholder:text-muted-foreground border-input"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px] bg-background text-foreground border-input">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Landscaping">Landscaping</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading RFQ invitations...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading RFQs</h3>
                <p className="text-muted-foreground">
                  {(error as Error).message || 'Failed to load RFQ invitations. Please try again.'}
                </p>
              </div>
            )}

            {/* Project Grid */}
            {!isLoading && !error && (
              <div className="grid gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary bg-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-lg text-foreground">{project.title}</CardTitle>
                            <Badge className={cn("text-xs border", getStatusColor(project.status))}>
                              {project.status}
                            </Badge>
                            {project.inviteStatus === 'submitted' && (
                              <Badge variant="outline" className="text-xs border-success text-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Bid Submitted
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {project.description || 'No description provided'}
                          </p>
                        </div>
                        {project.category && (
                          <Badge className={cn("border shrink-0", getCategoryColor(project.category))}>
                            {project.category}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="text-muted-foreground">Property:</span>
                            <span className="ml-1 font-medium text-foreground truncate block">
                              {project.property?.title || project.property?.address || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Lots:</span>
                            <span className="ml-1 font-medium text-foreground">{project.lots.length}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Deadline:</span>
                            <span className="ml-1 font-medium text-foreground">{formatDeadline(project.deadline)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="ml-1 font-medium text-foreground truncate block">
                              {project.property?.city || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Invited {getTimeAgo(project.created_at)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/vendor/rfq/${project.id}`)}
                            className="border-border text-foreground hover:bg-muted"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          {project.status === 'open' && project.inviteStatus !== 'submitted' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  disabled={!canApplyToProjects}
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  Submit Bid
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-foreground">Submit Bid</DialogTitle>
                                  <DialogDescription className="text-muted-foreground">
                                    Submit your bid for "{project.title}"
                                  </DialogDescription>
                                </DialogHeader>
                                {project.lots.length > 0 ? (
                                  <VendorBidForm 
                                    rfqId={project.id}
                                    lots={project.lots}
                                    onSuccess={() => {
                                      refetchApplications();
                                    }}
                                  />
                                ) : (
                                  <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
                                    <p className="text-muted-foreground">No lots defined for this RFQ yet.</p>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {project.inviteStatus === 'submitted' && (
                            <Button variant="outline" size="sm" disabled className="border-success text-success">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Bid Submitted
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && !error && filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No RFQ Invitations</h3>
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Try adjusting your search criteria.'
                    : 'You have not been invited to any RFQs yet. Check back later for new opportunities.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
