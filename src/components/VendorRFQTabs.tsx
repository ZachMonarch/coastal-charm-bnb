import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, FileText, Award, DollarSign, Clock, Building, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useVendorRFQs } from '@/hooks/useVendorRFQs';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import VendorBidForm from './VendorBidForm';
import CountdownTimer from './CountdownTimer';
import VendorRFQSkeleton from './VendorRFQSkeleton';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { getStatusColor, getPriorityColor } from '@/utils/themeColors';

export default function VendorRFQTabs() {
  const { user, isSubscribed } = useAuth();
  const { availableRFQs, myBids, awardedProjects, draftBids, loading, submitBid, withdrawBid, saveDraftBid } = useVendorRFQs();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);

  const canApplyToProjects = user?.role === 'vendor' && isSubscribed('basic');

  const filteredRFQs = availableRFQs.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rfq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredBids = myBids.filter(bid => {
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    const matchesSearch = bid.project?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.project?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <VendorRFQSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Subscription Warning */}
      {!canApplyToProjects && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-warning" />
              <div>
                <h3 className="font-semibold text-warning">Subscription Required</h3>
                <p className="text-sm text-warning/80">
                  Upgrade to Basic plan or higher to submit bids on projects.
                </p>
              </div>
              <Button asChild className="ml-auto">
                <Link to="/vendor/dashboard?tab=subscription">Upgrade Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="available" className="w-full">
        <TabsList variant="default" className="w-full sm:w-auto">
          <TabsTrigger value="available" variant="default" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Available RFQs</span>
            <Badge variant="secondary" className="ml-1">{availableRFQs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bids" variant="default" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">My Bids</span>
            <Badge variant="secondary" className="ml-1">{myBids.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="awarded" variant="default" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Awarded</span>
            <Badge variant="secondary" className="ml-1">{awardedProjects.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Drafts
            <Badge variant="secondary" className="ml-1">{draftBids.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 my-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="renovation">Renovation</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Available RFQs Tab */}
        <TabsContent value="available" className="space-y-4">
          {filteredRFQs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No RFQs Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new project opportunities.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRFQs.map((rfq) => (
              <Card key={rfq.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg text-foreground">{rfq.title}</CardTitle>
                        <Badge className={cn("text-xs border", getPriorityColor(rfq.priority))}>
                          {rfq.priority}
                        </Badge>
                        {rfq.deadline && <CountdownTimer deadline={rfq.deadline} />}
                      </div>
                      <CardDescription>{rfq.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{rfq.category}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        ${rfq.budget_min || 0} - ${rfq.budget_max || 'Open'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{rfq.location || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px] text-foreground">
                      <span className="text-foreground font-medium">View Details</span>
                    </Button>
                    
                    {!canApplyToProjects ? (
                      <Button disabled size="sm" className="w-full sm:w-auto">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Subscription Required
                      </Button>
                    ) : (
                      <Dialog open={showBidForm && selectedProject?.id === rfq.id} onOpenChange={(open) => {
                        setShowBidForm(open);
                        if (!open) setSelectedProject(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedProject(rfq)}
                            className="w-full sm:w-auto text-white"
                            style={{ color: 'white' }}
                          >
                            Submit Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Submit Bid</DialogTitle>
                            <DialogDescription>
                              Submit your bid for "{rfq.title}"
                            </DialogDescription>
                          </DialogHeader>
                          {selectedProject && (
                            <VendorBidForm 
                              project={selectedProject}
                              onClose={() => {
                                setShowBidForm(false);
                                setSelectedProject(null);
                              }}
                              onSuccess={() => {
                                setShowBidForm(false);
                                setSelectedProject(null);
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* My Bids Tab */}
        <TabsContent value="bids" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredBids.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bids Submitted</h3>
                <p className="text-muted-foreground">
                  Submit your first bid on an available RFQ to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBids.map((bid) => (
              <Card key={bid.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{bid.project?.title}</CardTitle>
                        <Badge className={cn("text-xs border", getStatusColor(bid.status))}>
                          {bid.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>{bid.project?.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bid Amount:</span>
                      <span className="ml-2 font-medium">${bid.bid_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">{bid.estimated_duration || 'TBD'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {new Date(bid.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={cn("ml-2", getStatusColor(bid.status))}>
                        {bid.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="min-h-[44px] text-foreground">
                      <span className="text-foreground font-medium">View Details</span>
                    </Button>
                    {bid.status === 'submitted' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => withdrawBid(bid.id)}
                      >
                        Withdraw Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Awarded Projects Tab */}
        <TabsContent value="awarded" className="space-y-4">
          {awardedProjects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Awarded Projects</h3>
                <p className="text-muted-foreground">
                  Keep submitting quality bids to win your first project!
                </p>
              </CardContent>
            </Card>
          ) : (
            awardedProjects.map((project) => (
              <Card key={project.id} className="border-success/30 bg-success/10 dark:border-success/40 dark:bg-success/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{project.project?.title}</CardTitle>
                        <Badge className="bg-success/10 text-success border-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Awarded
                        </Badge>
                      </div>
                      <CardDescription>{project.project?.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Winning Bid:</span>
                      <span className="ml-2 font-medium text-success">${project.bid_amount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">{project.estimated_duration || 'TBD'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Awarded:</span>
                      <span className="ml-2 font-medium">
                        {new Date(project.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm">
                      <Link to={`/vendor/projects/${project.project?.id}`}>
                        View Project
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Draft Bids Tab */}
        <TabsContent value="drafts" className="space-y-4">
          {draftBids.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Draft Bids</h3>
                <p className="text-muted-foreground">
                  Start working on a bid and it will be automatically saved here.
                </p>
              </CardContent>
            </Card>
          ) : (
            draftBids.map((draft) => {
              const project = availableRFQs.find(p => p.id === draft.project_id);
              return (
                <Card key={draft.project_id} className="border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{project?.title || 'Project Not Found'}</CardTitle>
                          <Badge className="bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40">
                            Draft
                          </Badge>
                        </div>
                        <CardDescription>
                          Last saved: {new Date(draft.last_saved).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bid Amount:</span>
                        <span className="ml-2 font-medium">
                          {draft.bid_amount ? `$${draft.bid_amount}` : 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">{draft.estimated_duration || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Proposal:</span>
                        <span className="ml-2 font-medium">
                          {draft.proposal_details ? 'In progress' : 'Not started'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Continue Editing
                      </Button>
                      <Button variant="destructive" size="sm">
                        Delete Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}