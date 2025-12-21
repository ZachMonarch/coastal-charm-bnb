import { useParams, useNavigate } from 'react-router-dom';
import { useRFQDetail } from '@/hooks/useRFQDetail';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RFQSectionCollapsible from '@/components/rfq/RFQSectionCollapsible';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import RFQDocumentList from '@/components/rfq/RFQDocumentList';
import LoadingSpinner from '@/components/LoadingSpinner';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import { 
  ArrowLeft, FileText, Building, Calendar, DollarSign, 
  Shield, Wrench, ClipboardList, Download, Clock,
  Mail, Globe, MapPin, CheckCircle2, AlertTriangle, HardHat, Send
} from 'lucide-react';
import { format } from 'date-fns';

export default function VendorComprehensiveRFQDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: rfq, isLoading, error } = useRFQDetail(id);

  // Check if vendor has already submitted a bid
  const { data: existingBid } = useQuery({
    queryKey: ['vendor-bid-check', id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      
      const { data: lots } = await supabase
        .from('rfq_lots')
        .select('id')
        .eq('rfq_id', id);
      
      if (!lots || lots.length === 0) return null;
      
      const { data, error } = await supabase
        .from('bid_lines')
        .select('id')
        .eq('vendor_id', user.id)
        .in('rfq_lot_id', lots.map(l => l.id))
        .limit(1);
      
      if (error) return null;
      return data && data.length > 0;
    },
    enabled: !!id && !!user?.id,
  });

  // Fetch lots
  const { data: lots = [] } = useQuery({
    queryKey: ['vendor-rfq-lots', id],
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

  if (isLoading) {
    return (
      <OptimizedProtectedRoute requiredRole="vendor">
        <div className="container mx-auto py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      </OptimizedProtectedRoute>
    );
  }

  if (error || !rfq) {
    return (
      <OptimizedProtectedRoute requiredRole="vendor">
        <div className="container mx-auto py-12 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">RFQ Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'The requested RFQ could not be found or you may not have access.'}
          </p>
          <Button onClick={() => navigate('/vendor/rfq')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFQs
          </Button>
        </div>
      </OptimizedProtectedRoute>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const isDeadlinePassed = new Date(rfq.deadline) < new Date();

  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <EnhancedPageBackground pattern="dots" gradient="mesh" primaryColor="primary" intensity="subtle" showOrbs>
        <div className="container mx-auto py-6 space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/vendor/rfq')}>
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
                {existingBid && (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Bid Submitted
                  </Badge>
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
            <div className="flex gap-2">
              {rfq.status === 'open' && !existingBid && !isDeadlinePassed && (
                <Button onClick={() => navigate(`/vendor/rfq/${id}/bid`)} size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Bid
                </Button>
              )}
              {isDeadlinePassed && (
                <Badge variant="destructive" className="text-sm py-2 px-4">
                  Deadline Passed
                </Badge>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <p className="text-sm text-muted-foreground">Bid Lots</p>
                  <p className="text-lg font-bold text-foreground">{lots.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-bold text-foreground">{rfq.expected_duration || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Control */}
          {rfq.document_control && Object.keys(rfq.document_control).length > 0 && (
            <RFQSectionCollapsible
              title="Document Control & Project Identification"
              icon={<ClipboardList className="h-5 w-5" />}
              defaultOpen={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-sm text-muted-foreground">Property Manager</p>
                    <p className="font-medium text-foreground">{rfq.document_control.issuer}</p>
                  </div>
                )}
                {rfq.document_control.project_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Project Team Email</p>
                      <a href={`mailto:${rfq.document_control.project_email}`} className="font-medium text-primary hover:underline">
                        {rfq.document_control.project_email}
                      </a>
                    </div>
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
              </div>
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
                  <p className="text-muted-foreground">{rfq.executive_summary.project_summary}</p>
                </div>
              )}
              {rfq.executive_summary.design_intent && (
                <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Design Intent</h4>
                  <p className="text-muted-foreground">{rfq.executive_summary.design_intent}</p>
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
                  {Object.entries(rfq.building_details).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{String(value)}</TableCell>
                    </TableRow>
                  ))}
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
              title="Unit Configuration"
              icon={<Building className="h-5 w-5" />}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Size</TableHead>
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
              title="Technical Specifications & BOQ"
              icon={<ClipboardList className="h-5 w-5" />}
            >
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

              {rfq.technical_specs.installation_scope && (
                <div className="mb-4">
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
              )}
            </RFQSectionCollapsible>
          )}

          {/* Codes & Compliance */}
          {rfq.codes_compliance && rfq.codes_compliance.length > 0 && (
            <RFQSectionCollapsible
              title="Codes & Compliance"
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
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Required Qualifications</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {rfq.staffing_requirements.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </RFQSectionCollapsible>
          )}

          {/* Budget Guidance */}
          {rfq.budget_guidance && Object.keys(rfq.budget_guidance).length > 0 && (
            <RFQSectionCollapsible
              title="Budget Guidance"
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
                  <p className="text-sm text-muted-foreground">Total Estimated Budget</p>
                  <p className="text-2xl font-bold text-primary">{rfq.budget_guidance.total_estimate}</p>
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
              defaultOpen={true}
            >
              <RFQDocumentList documents={rfq.documents} rfqTitle={rfq.title} />
            </RFQSectionCollapsible>
          )}

          {/* Bid Lots */}
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

          {/* Submit Bid CTA */}
          {rfq.status === 'open' && !existingBid && !isDeadlinePassed && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Ready to Submit Your Bid?</h3>
                  <p className="text-muted-foreground">
                    Review the requirements above and submit your competitive bid for this project.
                  </p>
                </div>
                <Button onClick={() => navigate(`/vendor/rfq/${id}/bid`)} size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Bid
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </EnhancedPageBackground>
    </OptimizedProtectedRoute>
  );
}
