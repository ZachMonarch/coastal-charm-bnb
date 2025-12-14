import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useVendorContacts, ContactType, VendorContact } from "@/hooks/useVendorContacts";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  Search, MapPin, Clock, DollarSign, Calendar, ArrowRight, Plus,
  CheckCircle2, XCircle, Eye, Send, AlertCircle, Zap, Target,
  Users, Briefcase, Handshake, UserCheck, Edit, Trash2, Phone, Mail
} from "lucide-react";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHeroWithImage from "@/components/shared/PageHeroWithImage";
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
  match_id?: string;
  match_status?: string;
  quote_amount?: number;
}

export default function VendorLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contacts, loading: contactsLoading, createContact, updateContact, deleteContact, getContactStats } = useVendorContacts();
  
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<QuoteRequest[]>([]);
  const [myResponses, setMyResponses] = useState<QuoteRequest[]>([]);
  const [selectedLead, setSelectedLead] = useState<QuoteRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  
  // Contact dialog state
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<VendorContact | null>(null);
  const [contactForm, setContactForm] = useState({
    contact_type: 'contact' as ContactType,
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    source: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  const contactStats = getContactStats();

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
      const { data, error } = await supabase
        .from('quick_quote_requests')
        .select('id, title, description, service_category, urgency, budget_min, budget_max, location_city, location_zip, preferred_start_date, contact_name, status, created_at, expires_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
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
          id, response_status, quote_amount, quote_notes, created_at,
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

  // Contact Management
  const openAddContactDialog = (type: ContactType = 'contact') => {
    setEditingContact(null);
    setContactForm({
      contact_type: type,
      name: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
      source: '',
    });
    setShowContactDialog(true);
  };

  const openEditContactDialog = (contact: VendorContact) => {
    setEditingContact(contact);
    setContactForm({
      contact_type: contact.contact_type,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      notes: contact.notes || '',
      source: contact.source || '',
    });
    setShowContactDialog(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSavingContact(true);
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactForm);
      } else {
        await createContact(contactForm);
      }
      setShowContactDialog(false);
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact(id);
    }
  };

  const getContactsByType = (type: ContactType) => contacts.filter(c => c.contact_type === type);

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

  const renderContactCard = (contact: VendorContact) => (
    <Card key={contact.id} className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{contact.name}</h4>
              <Badge variant="outline" className="text-xs">{contact.status}</Badge>
            </div>
            {contact.company && (
              <p className="text-sm text-muted-foreground">{contact.company}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary">
                  <Mail className="h-3 w-3" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </a>
              )}
            </div>
            {contact.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{contact.notes}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEditContactDialog(contact)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteContact(contact.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !vendorProfile) {
    return (
      <PrivatePageWrapper title="Leads">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Leads & Contacts">
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="warning" intensity="subtle" showOrbs>
        <div className="container mx-auto px-4 py-8">
          <PageHeroWithImage
            title="Leads & Contacts"
            description="Manage quote requests and your business contacts"
            icon={Target}
            backgroundImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1920&q=80"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Available Leads"
              value={leads.length}
              icon={Target}
              color="warning"
              animated
            />
            <StatsCard
              title="My Contacts"
              value={contactStats.total}
              icon={Users}
              color="info"
              animated
            />
            <StatsCard
              title="Customers"
              value={contactStats.customers}
              icon={UserCheck}
              color="success"
              animated
            />
            <StatsCard
              title="Partners"
              value={contactStats.partners}
              icon={Handshake}
              color="primary"
              animated
            />
          </div>

          <Tabs defaultValue="available" className="space-y-6">
            <TabsList>
              <TabsTrigger value="available">Available ({leads.length})</TabsTrigger>
              <TabsTrigger value="responses">My Responses ({myResponses.length})</TabsTrigger>
              <TabsTrigger value="leads">My Leads ({contactStats.leads})</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contactStats.contacts})</TabsTrigger>
              <TabsTrigger value="partners">Partners ({contactStats.partners})</TabsTrigger>
              <TabsTrigger value="customers">Customers ({contactStats.customers})</TabsTrigger>
            </TabsList>

            {/* Available Leads Tab */}
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
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">{lead.service_category}</Badge>
                              {getUrgencyBadge(lead.urgency)}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{lead.title}</h3>
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
                            <Button variant="outline" onClick={() => handleDeclineLead(lead.id)}>
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

            {/* My Responses Tab */}
            <TabsContent value="responses" className="space-y-4">
              {myResponses.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Responses Yet</h3>
                    <p className="text-muted-foreground">Start responding to leads to see them here</p>
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

            {/* Contact Type Tabs */}
            {(['leads', 'contacts', 'partners', 'customers'] as const).map((type) => {
              const typeContacts = getContactsByType(type === 'leads' ? 'lead' : type === 'contacts' ? 'contact' : type === 'partners' ? 'partner' : 'customer');
              const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
              const TypeIcon = type === 'leads' ? Target : type === 'contacts' ? Users : type === 'partners' ? Handshake : UserCheck;
              
              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      {typeLabel}
                    </h3>
                    <Button onClick={() => openAddContactDialog(type === 'leads' ? 'lead' : type === 'contacts' ? 'contact' : type === 'partners' ? 'partner' : 'customer')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add {typeLabel.slice(0, -1)}
                    </Button>
                  </div>
                  
                  {typeContacts.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <TypeIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No {typeLabel} Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add your first {type === 'leads' ? 'lead' : type.slice(0, -1)} to get started
                        </p>
                        <Button onClick={() => openAddContactDialog(type === 'leads' ? 'lead' : type === 'contacts' ? 'contact' : type === 'partners' ? 'partner' : 'customer')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add {typeLabel.slice(0, -1)}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {typeContacts.map(renderContactCard)}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Quote Dialog */}
          <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedLead?.title}</DialogTitle>
                <DialogDescription>Submit your quote for this project</DialogDescription>
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

                  <div className="space-y-2">
                    <Label>Your Quote Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add details about your quote, timeline, or approach..."
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedLead(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitQuote} disabled={submittingQuote || !quoteAmount}>
                      {submittingQuote ? "Submitting..." : "Submit Quote"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add/Edit Contact Dialog */}
          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                <DialogDescription>
                  {editingContact ? 'Update contact information' : 'Add a new contact to your CRM'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Contact Type</Label>
                  <Select
                    value={contactForm.contact_type}
                    onValueChange={(value: ContactType) => setContactForm(prev => ({ ...prev, contact_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={contactForm.company}
                      onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      value={contactForm.source}
                      onChange={(e) => setContactForm(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="Referral, Website, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={contactForm.notes}
                    onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this contact..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveContact} disabled={savingContact || !contactForm.name.trim()}>
                    {savingContact ? "Saving..." : editingContact ? "Update" : "Add Contact"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
