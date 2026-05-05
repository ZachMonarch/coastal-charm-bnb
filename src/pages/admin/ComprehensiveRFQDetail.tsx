import { useParams, useNavigate } from 'react-router-dom';
import { useRFQDetail } from '@/hooks/useRFQDetail';
import { useRFQSubscription } from '@/hooks/useRFQSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RFQSectionCollapsible from '@/components/rfq/RFQSectionCollapsible';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import { BidAmountDisplay } from '@/components/rfq/shared/BidAmountDisplay';
import ContractAward from '@/components/contracts/ContractAward';
import RFQDocumentList from '@/components/rfq/RFQDocumentList';
import RFQScoringWeightsEditor from '@/components/rfq/RFQScoringWeightsEditor';
import LoadingSpinner from '@/components/LoadingSpinner';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import { 
  ArrowLeft, FileText, Building, Calendar, Users, DollarSign, 
  Shield, Wrench, ClipboardList, BarChart3, Download, Clock,
  Mail, Globe, MapPin, CheckCircle2, AlertTriangle, HardHat, Copy, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ComprehensiveRFQDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  useRFQSubscription(id);
  const { data: rfq, isLoading, error } = useRFQDetail(id);

  // Fetch lots
  const { data: lots = [] } = useQuery({
    queryKey: ['rfq-lots', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_lots')
        .select('id, lot_name, quantity, unit_of_measure, specifications')
        .eq('rfq_id', id!)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch bids
  const { data: bids = [] } = useQuery({
    queryKey: ['rfq-bids', id],
    queryFn: async () => {
      if (!lots.length) return [];
      const lotIds = lots.map(l => l.id);
      
      const { data, error } = await supabase
        .from('bid_lines')
        .select(`
          id, vendor_id, unit_price, notes, submitted_at,
          rfq_lot:rfq_lots(id, lot_name, quantity)
        `)
        .in('rfq_lot_id', lotIds);

      if (error) throw error;

      // Group by vendor
      const grouped = (data || []).reduce((acc: any, bid: any) => {
        const vendorId = bid.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = { vendor_id: vendorId, bids: [], total: 0 };
        }
        const total = bid.unit_price * (bid.rfq_lot?.quantity || 1);
        acc[vendorId].bids.push({ ...bid, total });
        acc[vendorId].total += total;
        return acc;
      }, {});

      // Fetch vendor names
      const vendorIds = Object.keys(grouped);
      if (vendorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', vendorIds);
        
        profiles?.forEach(p => {
          if (grouped[p.id]) {
            grouped[p.id].vendor_name = p.full_name;
            grouped[p.id].vendor_email = p.email;
          }
        });
      }

      return Object.values(grouped);
    },
    enabled: !!id && lots.length > 0,
  });

  // Fetch invites
  const { data: invites = [] } = useQuery({
    queryKey: ['rfq-invites', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_invites')
        .select('id, status, invited_at, vendor_id')
        .eq('rfq_id', id!);
      if (error) throw error;
      
      // Get vendor names
      const vendorIds = (data || []).map(i => i.vendor_id);
      if (vendorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', vendorIds);
        
        return (data || []).map(inv => {
          const profile = profiles?.find(p => p.id === inv.vendor_id);
          return { ...inv, vendor_name: profile?.full_name, vendor_email: profile?.email };
        });
      }
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">RFQ Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'The requested RFQ could not be found.'}
        </p>
        <Button onClick={() => navigate('/admin/rfq')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQs
        </Button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <EnhancedPageBackground pattern="dots" gradient="mesh" primaryColor="primary" intensity="subtle" showOrbs>
      <div className="container mx-auto py-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/admin/rfq')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to RFQs
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <RFQStatusBadge status={rfq.status as any} />
              {rfq.category && (
                <Badge variant="outline">{rfq.category}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{rfq.title}</h1>
            {rfq.document_control?.project_name && (
              <p className="text-lg text-muted-foreground">{rfq.document_control.project_name}</p>
            )}
            {rfq.document_control?.rfq_reference && (
              <p className="text-sm text-muted-foreground">
                Reference: {rfq.document_control.rfq_reference}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/admin/rfq/${id}`);
              toast.success('Admin link copied to clipboard');
            }}>
              <Copy className="h-4 w-4 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/vendor/rfq/${id}/details`);
              toast.success('Vendor share link copied to clipboard');
            }}>
              <Share2 className="h-4 w-4 mr-1" /> Share to Vendor
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/rfq/${id}/edit`)}>
              Edit RFQ
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="text-lg font-bold text-foreground">{formatDate(rfq.deadline)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Lots</p>
                <p className="text-lg font-bold text-foreground">{lots.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Invited Vendors</p>
                <p className="text-lg font-bold text-foreground">{invites.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Bids Received</p>
                <p className="text-lg font-bold text-foreground">{bids.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Control Section */}
        {rfq.document_control && Object.keys(rfq.document_control).length > 0 && (
          <RFQSectionCollapsible
            title="Document Control & Project Identification"
            icon={<ClipboardList className="h-5 w-5" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rfq.document_control.document_title && (
                <div>
                  <p className="text-sm text-muted-foreground">Document Title</p>
                  <p className="font-medium text-foreground">{rfq.document_control.document_title}</p>
                </div>
              )}
              {rfq.document_control.project_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project Address</p>
                    <p className="font-medium text-foreground">{rfq.document_control.project_address}</p>
                  </div>
                </div>
              )}
              {rfq.document_control.issuer && (
                <div>
                  <p className="text-sm text-muted-foreground">Property Manager / Issuer</p>
                  <p className="font-medium text-foreground">{rfq.document_control.issuer}</p>
                </div>
              )}
              {rfq.document_control.website && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium text-foreground">{rfq.document_control.website}</p>
                  </div>
                </div>
              )}
              {rfq.document_control.project_email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project Team Email</p>
                    <p className="font-medium text-foreground">{rfq.document_control.project_email}</p>
                  </div>
                </div>
              )}
              {rfq.document_control.document_status && (
                <div>
                  <p className="text-sm text-muted-foreground">Document Status</p>
                  <Badge variant="outline" className="mt-1">{rfq.document_control.document_status}</Badge>
                </div>
              )}
            </div>
            {rfq.document_control.issue_purpose && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Issue Purpose</p>
                <p className="text-foreground">{rfq.document_control.issue_purpose}</p>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Executive Summary */}
        {rfq.executive_summary && Object.keys(rfq.executive_summary).length > 0 && (
          <RFQSectionCollapsible
            title="Executive Project Overview"
            icon={<FileText className="h-5 w-5" />}
            defaultOpen={true}
          >
            {rfq.executive_summary.project_summary && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-2">Project Summary</h4>
                <p className="text-muted-foreground">{rfq.executive_summary.project_summary}</p>
              </div>
            )}
            {rfq.executive_summary.design_intent && (
              <div className="mb-4 p-3 bg-info/10 border border-info/30 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Design Intent</h4>
                <p className="text-muted-foreground">{rfq.executive_summary.design_intent}</p>
              </div>
            )}
            {rfq.executive_summary.expected_duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expected Duration:</span>
                <span className="font-medium text-foreground">{rfq.executive_summary.expected_duration}</span>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Building Details */}
        {rfq.building_details && Object.keys(rfq.building_details).length > 0 && (
          <RFQSectionCollapsible
            title="Building Details"
            icon={<Building className="h-5 w-5" />}
          >
            <Table>
              <TableBody>
                {rfq.building_details.building_type && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Building Type</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.building_type}</TableCell>
                  </TableRow>
                )}
                {rfq.building_details.floors && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Floors</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.floors}</TableCell>
                  </TableRow>
                )}
                {rfq.building_details.total_area && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Total Building Area</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.total_area}</TableCell>
                  </TableRow>
                )}
                {rfq.building_details.residential_units && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Residential Units</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.residential_units}</TableCell>
                  </TableRow>
                )}
                {rfq.building_details.common_areas && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Common Areas</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.common_areas}</TableCell>
                  </TableRow>
                )}
                {rfq.building_details.parking && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Parking</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.parking}</TableCell>
                  </TableRow>
                )}
                {rfq.building_details.fire_protection && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Fire Protection</TableCell>
                    <TableCell className="text-muted-foreground">{rfq.building_details.fire_protection}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </RFQSectionCollapsible>
        )}

        {/* System Strategy */}
        {rfq.system_strategy && Object.keys(rfq.system_strategy).length > 0 && (
          <RFQSectionCollapsible
            title="System Strategy & Design Intent"
            icon={<Wrench className="h-5 w-5" />}
            badge={<Badge variant="destructive" className="text-xs">Non-Negotiable</Badge>}
          >
            {rfq.system_strategy.system_type && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-2">System Type</h4>
                <p className="text-lg text-primary font-medium">{rfq.system_strategy.system_type}</p>
              </div>
            )}
            {rfq.system_strategy.prohibited_systems && rfq.system_strategy.prohibited_systems.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-2">Prohibited Systems</h4>
                <ul className="list-disc list-inside space-y-1 text-destructive">
                  {rfq.system_strategy.prohibited_systems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {rfq.system_strategy.rationale && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Rationale</h4>
                <p className="text-muted-foreground">{rfq.system_strategy.rationale}</p>
              </div>
            )}
            {rfq.system_strategy.design_finality && rfq.system_strategy.design_finality.length > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Design Finality Statement
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {rfq.system_strategy.design_finality.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Unit Configuration */}
        {rfq.unit_configuration && rfq.unit_configuration.length > 0 && (
          <RFQSectionCollapsible
            title="Unit Configuration & HVAC Specs"
            icon={<Building className="h-5 w-5" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Typical Size</TableHead>
                  <TableHead>HVAC Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.unit_configuration.map((unit, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-foreground">{unit.unit_type}</TableCell>
                    <TableCell className="text-muted-foreground">{unit.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{unit.typical_size}</TableCell>
                    <TableCell className="text-muted-foreground">{unit.hvac_capacity || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </RFQSectionCollapsible>
        )}

        {/* Technical Specifications */}
        {rfq.technical_specs && Object.keys(rfq.technical_specs).length > 0 && (
          <RFQSectionCollapsible
            title="Technical Specifications"
            icon={<ClipboardList className="h-5 w-5" />}
          >
            {/* Load Summary */}
            {rfq.technical_specs.cooling_load_summary && (
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3">Cooling Load Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Residential</p>
                    <p className="text-xl font-bold text-foreground">{rfq.technical_specs.cooling_load_summary.residential}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Common Area</p>
                    <p className="text-xl font-bold text-foreground">{rfq.technical_specs.cooling_load_summary.common_area}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg text-center border border-primary/30">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">{rfq.technical_specs.cooling_load_summary.total}</p>
                  </div>
                </div>
              </div>
            )}

            {/* BOQ Tables */}
            {rfq.technical_specs.boq?.residential_systems && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-2">BOQ - Residential Systems</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfq.technical_specs.boq.residential_systems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-foreground">{item.item}</TableCell>
                        <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Installation Scope */}
            {rfq.technical_specs.installation_scope && rfq.technical_specs.installation_scope.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-foreground mb-2">Installation Responsibilities</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {rfq.technical_specs.installation_scope.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Commercial Framework */}
        {rfq.commercial_framework && Object.keys(rfq.commercial_framework).length > 0 && (
          <RFQSectionCollapsible
            title="Commercial & Payment Framework"
            icon={<DollarSign className="h-5 w-5" />}
          >
            {rfq.commercial_framework.installation_milestones && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-3">Installation Payment Milestones</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Payment %</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfq.commercial_framework.installation_milestones.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-foreground">{m.milestone}</TableCell>
                        <TableCell className="text-primary font-bold">{m.payment_percent}</TableCell>
                        <TableCell className="text-muted-foreground">{m.condition}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {rfq.commercial_framework.maintenance_payment && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Maintenance & Services Payment</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Payment Terms</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfq.commercial_framework.maintenance_payment.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-foreground">{m.service_type}</TableCell>
                        <TableCell className="text-muted-foreground">{m.payment_terms}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Codes & Compliance */}
        {rfq.codes_compliance && rfq.codes_compliance.length > 0 && (
          <RFQSectionCollapsible
            title="Codes & Compliance Requirements"
            icon={<Shield className="h-5 w-5" />}
          >
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {rfq.codes_compliance.map((code, idx) => (
                <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  {code}
                </li>
              ))}
            </ul>
          </RFQSectionCollapsible>
        )}

        {/* Staffing Requirements */}
        {rfq.staffing_requirements && Object.keys(rfq.staffing_requirements).length > 0 && (
          <RFQSectionCollapsible
            title="Staffing & Qualifications"
            icon={<HardHat className="h-5 w-5" />}
          >
            {rfq.staffing_requirements.team_size && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Recommended Team Size</p>
                <p className="text-xl font-bold text-foreground">{rfq.staffing_requirements.team_size}</p>
              </div>
            )}
            {rfq.staffing_requirements.requirements && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-2">Required Qualifications</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {rfq.staffing_requirements.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {rfq.staffing_requirements.suggested_staffing && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Suggested Staffing per Shift</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {rfq.staffing_requirements.suggested_staffing.map((staff, idx) => (
                    <li key={idx}>{staff}</li>
                  ))}
                </ul>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Budget Guidance */}
        {rfq.budget_guidance && Object.keys(rfq.budget_guidance).length > 0 && (
          <RFQSectionCollapsible
            title="Budget Guidance (Recommended)"
            icon={<DollarSign className="h-5 w-5" />}
          >
            {rfq.budget_guidance.items && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Budget Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.budget_guidance.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-foreground">{item.service}</TableCell>
                      <TableCell className="text-primary font-medium">{item.budget_range}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {rfq.budget_guidance.total_estimate && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Estimated Project Budget</p>
                <p className="text-2xl font-bold text-primary">{rfq.budget_guidance.total_estimate}</p>
              </div>
            )}
            {rfq.budget_guidance.notes && rfq.budget_guidance.notes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {rfq.budget_guidance.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </RFQSectionCollapsible>
        )}

        {/* Documents */}
        {rfq.documents && rfq.documents.length > 0 && (
          <RFQSectionCollapsible
            title="Project Documents"
            icon={<Download className="h-5 w-5" />}
            badge={<Badge variant="outline">{rfq.documents.length} files</Badge>}
          >
            <RFQDocumentList documents={rfq.documents} rfqTitle={rfq.title} />
          </RFQSectionCollapsible>
        )}

        {/* Scoring Engine Weights */}
        <RFQSectionCollapsible
          title="Scoring Engine"
          icon={<BarChart3 className="h-5 w-5" />}
        >
          <RFQScoringWeightsEditor rfqId={rfq.id} />
        </RFQSectionCollapsible>

        {/* Lots */}
        <RFQSectionCollapsible
          title={`Bid Lots (${lots.length})`}
          icon={<FileText className="h-5 w-5" />}
          defaultOpen={true}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium text-foreground">{lot.lot_name}</TableCell>
                  <TableCell className="text-muted-foreground">{lot.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{lot.unit_of_measure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </RFQSectionCollapsible>

        {/* Invited Vendors */}
        <RFQSectionCollapsible
          title={`Invited Vendors (${invites.length})`}
          icon={<Users className="h-5 w-5" />}
        >
          {invites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-foreground">{inv.vendor_name || 'Unknown'}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.vendor_email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'submitted' ? 'default' : 'outline'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.invited_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No vendors invited yet.</p>
          )}
        </RFQSectionCollapsible>

        {/* Bids Received */}
        <RFQSectionCollapsible
          title={`Bids Received (${bids.length})`}
          icon={<BarChart3 className="h-5 w-5" />}
          defaultOpen={bids.length > 0}
        >
          {bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map((bid: any) => (
                <Card key={bid.vendor_id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg text-foreground">{bid.vendor_name || 'Unknown Vendor'}</CardTitle>
                        <CardDescription>{bid.vendor_email}</CardDescription>
                      </div>
                      <div className="text-right">
                        <BidAmountDisplay amount={bid.total} size="lg" />
                        {rfq.status === 'open' && (
                          <div className="mt-2">
                            <ContractAward
                              rfqId={rfq.id}
                              vendorId={bid.vendor_id}
                              vendorName={bid.vendor_name || 'Unknown'}
                              bidAmount={bid.total}
                              onSuccess={() => navigate('/admin/contracts')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lot</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Line Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bid.bids.map((line: any) => (
                          <TableRow key={line.id}>
                            <TableCell className="text-foreground">{line.rfq_lot?.lot_name}</TableCell>
                            <TableCell className="text-muted-foreground">${line.unit_price?.toLocaleString()}</TableCell>
                            <TableCell className="text-muted-foreground">{line.rfq_lot?.quantity}</TableCell>
                            <TableCell className="text-foreground font-medium">${line.total?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No bids received yet.</p>
          )}
        </RFQSectionCollapsible>
      </div>
    </EnhancedPageBackground>
  );
}
