import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Building, DollarSign, Clock, Star, Calendar, 
  Mail, MessageSquare, FileText, CheckCircle2, XCircle,
  AlertCircle, Send
} from 'lucide-react';
import { AdminBid } from '@/hooks/useAdminBids';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';

interface BidDetailModalProps {
  bid: AdminBid;
  open: boolean;
  onClose: () => void;
  onRequestInfo: (bidId: string, message: string) => void;
  onRequestDocs: (bidId: string, documentTypes: string[]) => void;
  onShortlist: (bidId: string) => void;
  onAward: (bidId: string, projectId: string) => void;
  onReject: (bidId: string, reason?: string) => void;
}

const documentTypes = [
  { id: 'license', label: 'Business License' },
  { id: 'insurance', label: 'Insurance Certificate' },
  { id: 'references', label: 'References' },
  { id: 'portfolio', label: 'Portfolio/Past Work' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'quote_breakdown', label: 'Detailed Quote Breakdown' },
];

export default function BidDetailModal({
  bid,
  open,
  onClose,
  onRequestInfo,
  onRequestDocs,
  onShortlist,
  onAward,
  onReject
}: BidDetailModalProps) {
  const [infoMessage, setInfoMessage] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleRequestInfo = () => {
    if (infoMessage.trim()) {
      onRequestInfo(bid.id, infoMessage);
      setInfoMessage('');
      setActiveAction(null);
    }
  };

  const handleRequestDocs = () => {
    if (selectedDocs.length > 0) {
      onRequestDocs(bid.id, selectedDocs);
      setSelectedDocs([]);
      setActiveAction(null);
    }
  };

  const handleReject = () => {
    onReject(bid.id, rejectReason || undefined);
    setRejectReason('');
    setActiveAction(null);
    onClose();
  };

  const handleAward = () => {
    if (bid.project_id) {
      onAward(bid.id, bid.project_id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bid Details
          </DialogTitle>
          <DialogDescription>
            Review bid information and take action
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList variant="grid" className="grid w-full grid-cols-3">
            <TabsTrigger variant="grid" value="details">Bid Details</TabsTrigger>
            <TabsTrigger variant="grid" value="vendor">Vendor Info</TabsTrigger>
            <TabsTrigger variant="grid" value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Bid Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    Bid Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-success">${bid.bid_amount?.toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-info" />
                    Estimated Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{bid.estimated_duration || 'Not specified'}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{bid.project_title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={bid.project_status || 'pending'} size="sm" />
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{bid.project_category}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Proposal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{bid.proposal_details}</p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Submitted: {format(new Date(bid.submitted_at), 'PPP p')}
              </div>
              <StatusBadge status={bid.status} />
            </div>
          </TabsContent>

          {/* Vendor Info Tab */}
          <TabsContent value="vendor" className="space-y-4">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{bid.vendor_name}</h3>
                    <p className="text-muted-foreground">{bid.vendor_company}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="font-medium">{bid.vendor_rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{bid.vendor_email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <Button 
                onClick={() => onShortlist(bid.id)}
                variant="outline"
                className="flex flex-col h-auto py-4 border-info/30 hover:bg-info/10"
                disabled={bid.status === 'shortlisted' || bid.status === 'awarded'}
              >
                <Star className="h-5 w-5 mb-1 text-info" />
                <span className="text-xs">Shortlist</span>
              </Button>
              <Button 
                onClick={handleAward}
                variant="outline"
                className="flex flex-col h-auto py-4 border-success/30 hover:bg-success/10"
                disabled={bid.status === 'awarded' || !bid.project_id}
              >
                <CheckCircle2 className="h-5 w-5 mb-1 text-success" />
                <span className="text-xs">Award</span>
              </Button>
              <Button 
                onClick={() => setActiveAction('request_info')}
                variant="outline"
                className="flex flex-col h-auto py-4 border-warning/30 hover:bg-warning/10"
              >
                <MessageSquare className="h-5 w-5 mb-1 text-warning" />
                <span className="text-xs">Request Info</span>
              </Button>
              <Button 
                onClick={() => setActiveAction('request_docs')}
                variant="outline"
                className="flex flex-col h-auto py-4 border-warning/30 hover:bg-warning/10"
              >
                <FileText className="h-5 w-5 mb-1 text-warning" />
                <span className="text-xs">Request Docs</span>
              </Button>
            </div>

            {/* Request Info Panel */}
            {activeAction === 'request_info' && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-warning" />
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="info_message">Message to Vendor</Label>
                    <Textarea
                      id="info_message"
                      value={infoMessage}
                      onChange={(e) => setInfoMessage(e.target.value)}
                      placeholder="Please provide additional details about..."
                      className="mt-2 bg-background"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleRequestInfo} disabled={!infoMessage.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
                    </Button>
                    <Button variant="outline" onClick={() => setActiveAction(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Documents Panel */}
            {activeAction === 'request_docs' && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-warning" />
                    Request Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {documentTypes.map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={doc.id}
                          checked={selectedDocs.includes(doc.label)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocs([...selectedDocs, doc.label]);
                            } else {
                              setSelectedDocs(selectedDocs.filter(d => d !== doc.label));
                            }
                          }}
                        />
                        <Label htmlFor={doc.id} className="text-sm cursor-pointer">
                          {doc.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleRequestDocs} disabled={selectedDocs.length === 0}>
                      <Send className="h-4 w-4 mr-2" />
                      Request Documents
                    </Button>
                    <Button variant="outline" onClick={() => setActiveAction(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reject Panel */}
            {activeAction === 'reject' && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Reject Bid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="reject_reason">Reason (Optional)</Label>
                    <Textarea
                      id="reject_reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="mt-2 bg-background"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleReject}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Bid
                    </Button>
                    <Button variant="outline" onClick={() => setActiveAction(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reject Button */}
            {!activeAction && bid.status !== 'rejected' && bid.status !== 'awarded' && (
              <Button 
                variant="outline" 
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setActiveAction('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject This Bid
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
