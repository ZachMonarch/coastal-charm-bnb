import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  Search, MapPin, Clock, DollarSign, Calendar, ArrowRight,
  CheckCircle2, XCircle, Eye, Send, AlertCircle, Zap, Filter, Target
} from "lucide-react";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { formatDistanceToNow } from "date-fns";

interface QuoteRequest {
  id: string;
  title: string;
  description: string;
  service_category: string;
  urgency: string;
  budget_min: number | null;
  budget_max: number | null;
  location_city: string;
  location_zip: string;
  preferred_start_date: string | null;
  contact_name: string;
  status: string;
  created_at: string;
  expires_at: string;
  // From vendor_lead_matches join
  match_id?: string;
  match_status?: string;
  quote_amount?: number;
}

export default function VendorLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<QuoteRequest[]>([]);
  const [myResponses, setMyResponses] = useState<QuoteRequest[]>([]);
  const [selectedLead, setSelectedLead] = useState<QuoteRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchVendorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (vendorProfile) {
      fetchLeads();
      fetchMyResponses();
    }
  }, [vendorProfile]);

  const fetchVendorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, specialties, service_areas')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setVendorProfile(data);
    } catch (error) {
      console.error("Error fetching vendor profile:", error);
      toast.error("Please complete your vendor profile first");
      navigate('/vendor/profile');
    }
  };

  const fetchLeads = async () => {
    if (!vendorProfile) return;
    
    setLoading(true);
    try {
      // Fetch open quote requests
      const { data, error } = await supabase
        .from('quick_quote_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter leads based on vendor specialties
      const filteredLeads = (data || []).filter(lead => 
        vendorProfile.specialties?.includes(lead.service_category)
      );
      
      setLeads(filteredLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResponses = async () => {
    if (!vendorProfile) return;

    try {
      const { data, error } = await supabase
        .from('vendor_lead_matches')
        .select(`
          id,
          response_status,
          quote_amount,
          quote_notes,
          created_at,
          quick_quote_requests (
            id, title, description, service_category, urgency,
            budget_min, budget_max, location_city, location_zip,
            preferred_start_date, contact_name, status, created_at, expires_at
          )
        `)
        .eq('vendor_id', vendorProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const responses = (data || []).map(match => ({
        ...match.quick_quote_requests,
        match_id: match.id,
        match_status: match.response_status,
        quote_amount: match.quote_amount,
      }));

      setMyResponses(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedLead || !vendorProfile || !quoteAmount) {
      toast.error("Please enter a quote amount");
      return;
    }

    setSubmittingQuote(true);
    try {
      const { error } = await supabase
        .from('vendor_lead_matches')
        .upsert({
          quote_request_id: selectedLead.id,
          vendor_id: vendorProfile.id,
          response_status: 'quoted',
          quote_amount: parseFloat(quoteAmount),
          quote_notes: quoteNotes,
          responded_at: new Date().toISOString(),
        }, {
          onConflict: 'quote_request_id,vendor_id'
        });

      if (error) throw error;

      toast.success("Quote submitted successfully!");
      setSelectedLead(null);
      setQuoteAmount("");
      setQuoteNotes("");
      fetchLeads();
      fetchMyResponses();
    } catch (error: any) {
      console.error("Error submitting quote:", error);
      toast.error(error.message || "Failed to submit quote");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleDeclineLead = async (leadId: string) => {
    if (!vendorProfile) return;

    try {
      const { error } = await supabase
        .from('vendor_lead_matches')
        .upsert({
          quote_request_id: leadId,
          vendor_id: vendorProfile.id,
          response_status: 'declined',
          responded_at: new Date().toISOString(),
        }, {
          onConflict: 'quote_request_id,vendor_id'
        });

      if (error) throw error;

      toast.success("Lead declined");
      fetchLeads();
    } catch (error) {
      console.error("Error declining lead:", error);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="destructive"><Zap className="w-3 h-3 mr-1" />Urgent</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'flexible':
        return <Badge variant="outline">Flexible</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'quoted':
        return <Badge className="bg-success/10 text-success border-success/30">Quoted</Badge>;
      case 'interested':
        return <Badge className="bg-info/10 text-info border-info/30">Interested</Badge>;
      case 'awarded':
        return <Badge className="bg-primary/10 text-primary border-primary/30">Awarded!</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-muted-foreground">Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <PrivatePageWrapper title="Leads">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Leads">
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="warning" intensity="subtle" showOrbs>
        <div className="container mx-auto px-4 py-8">
          <PageHero
            title="Vendor Leads"
            description="Browse and respond to quote requests in your service area"
            icon={Target}
            variant="gradient"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="Available Leads"
              value={leads.length}
              icon={Target}
              color="warning"
              animated
            />
            <StatsCard
              title="My Responses"
              value={myResponses.length}
              icon={Send}
              color="info"
              animated
            />
            <StatsCard
              title="Awarded"
              value={myResponses.filter(r => r.match_status === 'awarded').length}
              icon={CheckCircle2}
              color="success"
              animated
            />
          </div>

          <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">Available ({leads.length})</TabsTrigger>
            <TabsTrigger value="responses">My Responses ({myResponses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {leads.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Leads Available</h3>
                  <p className="text-muted-foreground mb-4">
                    New leads matching your services will appear here
                  </p>
                  <Button variant="outline" onClick={() => navigate('/vendor/profile')}>
                    Update Service Areas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {leads.map((lead) => (
                  <Card key={lead.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary">{lead.service_category}</Badge>
                                {getUrgencyBadge(lead.urgency)}
                              </div>
                              <h3 className="text-lg font-semibold text-foreground">{lead.title}</h3>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground line-clamp-2">{lead.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {lead.location_city}, {lead.location_zip}
                            </div>
                            {(lead.budget_min || lead.budget_max) && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {lead.budget_min && lead.budget_max
                                  ? `$${lead.budget_min} - $${lead.budget_max}`
                                  : lead.budget_max
                                  ? `Up to $${lead.budget_max}`
                                  : `From $${lead.budget_min}`
                                }
                              </div>
                            )}
                            {lead.preferred_start_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Start: {new Date(lead.preferred_start_date).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 lg:flex-col">
                          <Button onClick={() => setSelectedLead(lead)}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Quote
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleDeclineLead(lead.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            {myResponses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Responses Yet</h3>
                  <p className="text-muted-foreground">
                    Start responding to leads to see them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myResponses.map((response) => (
                  <Card key={response.match_id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{response.service_category}</Badge>
                            {getStatusBadge(response.match_status || 'pending')}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{response.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><MapPin className="h-4 w-4 inline mr-1" />{response.location_city}</span>
                            {response.quote_amount && (
                              <span className="font-medium text-foreground">
                                Your Quote: ${response.quote_amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => setSelectedLead(response)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quote Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="sm:max-w-lg" aria-describedby="quote-dialog-description">
            <DialogHeader>
              <DialogTitle>{selectedLead?.title}</DialogTitle>
              <DialogDescription id="quote-dialog-description">
                Submit your quote for this project
              </DialogDescription>
            </DialogHeader>
            
            {selectedLead && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{selectedLead.service_category}</Badge>
                    {getUrgencyBadge(selectedLead.urgency)}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedLead.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span><MapPin className="h-4 w-4 inline mr-1" />{selectedLead.location_city}, {selectedLead.location_zip}</span>
                    {(selectedLead.budget_min || selectedLead.budget_max) && (
                      <span>
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Budget: {selectedLead.budget_min && selectedLead.budget_max
                          ? `$${selectedLead.budget_min} - $${selectedLead.budget_max}`
                          : selectedLead.budget_max
                          ? `Up to $${selectedLead.budget_max}`
                          : `From $${selectedLead.budget_min}`
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Quote Amount ($) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter your quote"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                    <Textarea
                      placeholder="Add any notes about your quote, timeline, etc."
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedLead(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitQuote}
                    disabled={submittingQuote || !quoteAmount}
                    className="flex-1"
                  >
                    {submittingQuote ? "Submitting..." : "Submit Quote"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
