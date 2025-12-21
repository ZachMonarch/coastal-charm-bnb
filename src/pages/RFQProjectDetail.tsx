import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, MapPin, FileText, Building2, Wrench, DollarSign, Shield, Users, Clock, CheckCircle } from 'lucide-react';
import { useRFQDetail } from '@/hooks/useRFQDetail';
import RFQSectionCollapsible from '@/components/rfq/RFQSectionCollapsible';
import RFQDocumentList from '@/components/rfq/RFQDocumentList';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';

export default function RFQProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading, error } = useRFQDetail(id);

  if (isLoading) return <LoadingSpinner />;
  if (error || !rfq) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-2">RFQ Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-success text-success-foreground',
      draft: 'bg-muted text-muted-foreground',
      awarded: 'bg-primary text-primary-foreground',
      closed: 'bg-destructive text-destructive-foreground'
    };
    return colors[status] || 'bg-secondary';
  };

  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/vendor/rfq')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to RFQs
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Badge className={getStatusColor(rfq.status)}>{rfq.status.toUpperCase()}</Badge>
              <h1 className="text-3xl font-bold mt-2">{rfq.title}</h1>
              {rfq.document_control.project_name && (
                <p className="text-lg text-muted-foreground mt-1">{rfq.document_control.project_name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">RFQ Reference</p>
              <p className="font-mono font-semibold">{rfq.document_control.rfq_reference || rfq.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Deadline: <strong>{format(new Date(rfq.deadline), 'MMM dd, yyyy')}</strong></span>
            </div>
            {rfq.expected_duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Duration: <strong>{rfq.expected_duration}</strong></span>
              </div>
            )}
            {rfq.document_control.project_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{rfq.document_control.project_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Executive Summary */}
          {rfq.executive_summary.project_summary && (
            <RFQSectionCollapsible title="Executive Summary" icon={<FileText className="h-5 w-5" />} defaultOpen>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{rfq.executive_summary.project_summary}</p>
                {rfq.executive_summary.design_intent && (
                  <p className="mt-2 text-muted-foreground italic">{rfq.executive_summary.design_intent}</p>
                )}
              </div>
            </RFQSectionCollapsible>
          )}

          {/* Building Details */}
          {Object.keys(rfq.building_details).length > 0 && (
            <RFQSectionCollapsible title="Building Details" icon={<Building2 className="h-5 w-5" />}>
              <Table>
                <TableBody>
                  {Object.entries(rfq.building_details).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">{key.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </RFQSectionCollapsible>
          )}

          {/* System Strategy */}
          {rfq.system_strategy.system_type && (
            <RFQSectionCollapsible title="System Strategy" icon={<Wrench className="h-5 w-5" />}>
              <div className="space-y-4">
                <p><strong>System Type:</strong> {rfq.system_strategy.system_type}</p>
                {rfq.system_strategy.prohibited_systems && rfq.system_strategy.prohibited_systems.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Prohibited Systems:</p>
                    <ul className="list-disc list-inside space-y-1 text-destructive">
                      {rfq.system_strategy.prohibited_systems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </RFQSectionCollapsible>
          )}

          {/* Unit Configuration */}
          {rfq.unit_configuration.length > 0 && (
            <RFQSectionCollapsible title="Unit Configuration" icon={<Building2 className="h-5 w-5" />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Size (SF)</TableHead>
                    {rfq.unit_configuration[0].hvac_capacity && <TableHead className="text-right">HVAC Capacity</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.unit_configuration.map((unit, i) => (
                    <TableRow key={i}>
                      <TableCell>{unit.unit_type}</TableCell>
                      <TableCell className="text-right">{unit.quantity}</TableCell>
                      <TableCell className="text-right">{unit.typical_size}</TableCell>
                      {unit.hvac_capacity && <TableCell className="text-right">{unit.hvac_capacity}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </RFQSectionCollapsible>
          )}

          {/* Commercial Framework */}
          {rfq.commercial_framework.installation_milestones && (
            <RFQSectionCollapsible title="Payment Milestones" icon={<DollarSign className="h-5 w-5" />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead className="text-right">Payment %</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.commercial_framework.installation_milestones.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{m.milestone}</TableCell>
                      <TableCell className="text-right font-semibold">{m.payment_percent}</TableCell>
                      <TableCell>{m.condition}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </RFQSectionCollapsible>
          )}

          {/* Codes & Compliance */}
          {rfq.codes_compliance.length > 0 && (
            <RFQSectionCollapsible title="Codes & Compliance" icon={<Shield className="h-5 w-5" />}>
              <ul className="grid sm:grid-cols-2 gap-2">
                {rfq.codes_compliance.map((code, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {code}
                  </li>
                ))}
              </ul>
            </RFQSectionCollapsible>
          )}

          {/* Budget Guidance */}
          {rfq.budget_guidance.items && (
            <RFQSectionCollapsible title="Budget Guidance" icon={<DollarSign className="h-5 w-5" />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Budget Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.budget_guidance.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.service}</TableCell>
                      <TableCell className="text-right font-mono">{item.budget_range}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rfq.budget_guidance.total_estimate && (
                <p className="mt-4 text-lg font-semibold">
                  Total Estimate: {rfq.budget_guidance.total_estimate}
                </p>
              )}
            </RFQSectionCollapsible>
          )}

          {/* Documents */}
          {rfq.documents && rfq.documents.length > 0 && (
            <RFQSectionCollapsible title="Project Documents" icon={<FileText className="h-5 w-5" />} defaultOpen>
              <RFQDocumentList documents={rfq.documents} rfqTitle={rfq.title} />
            </RFQSectionCollapsible>
          )}
        </div>

        {/* Submit Bid CTA */}
        {rfq.status === 'open' && (
          <Card className="mt-8 border-2 border-primary">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready to Submit Your Bid?</h3>
                <p className="text-sm text-muted-foreground">
                  Deadline: {format(new Date(rfq.deadline), 'MMMM dd, yyyy')}
                </p>
              </div>
              <Button size="lg" onClick={() => navigate(`/vendor/rfq/${id}/bid`)}>
                Submit Bid
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </OptimizedProtectedRoute>
  );
}
