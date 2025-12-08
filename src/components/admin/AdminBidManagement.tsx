import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, RefreshCw, Eye, CheckCircle2, XCircle, MessageSquare, 
  FileText, Star, Award, DollarSign, Clock, User, Building,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { useAdminBids, AdminBid } from '@/hooks/useAdminBids';
import { StatusBadge } from '@/components/StatusBadge';
import BidDetailModal from './BidDetailModal';
import { formatDistanceToNow } from 'date-fns';

export default function AdminBidManagement() {
  const { bids, loading, refetch, updateBidStatus, requestInfo, requestDocuments, shortlistBid, awardBid, rejectBid } = useAdminBids();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBid, setSelectedBid] = useState<AdminBid | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredBids = bids.filter(bid => {
    const matchesSearch = 
      bid.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.vendor_company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: bids.length,
    pending: bids.filter(b => b.status === 'submitted' || b.status === 'pending').length,
    shortlisted: bids.filter(b => b.status === 'shortlisted').length,
    awarded: bids.filter(b => b.status === 'awarded').length,
    totalValue: bids.reduce((sum, b) => sum + (b.bid_amount || 0), 0)
  };

  const handleViewDetails = (bid: AdminBid) => {
    setSelectedBid(bid);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading bids...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/20 rounded-lg">
                <Star className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.shortlisted}</p>
                <p className="text-xs text-muted-foreground">Shortlisted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Award className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.awarded}</p>
                <p className="text-xs text-muted-foreground">Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Bid Management
              </CardTitle>
              <CardDescription>Review, comment, and manage vendor bids</CardDescription>
            </div>
            <Button onClick={refetch} variant="outline" size="sm" className="border-primary/20">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor, project, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-2 border-input focus:border-primary"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-primary/20">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="info_requested">Info Requested</SelectItem>
                <SelectItem value="docs_requested">Docs Requested</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bids Table */}
          {filteredBids.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bids found</h3>
              <p className="text-muted-foreground">
                {bids.length === 0 ? 'No bids have been submitted yet.' : 'No bids match your current filters.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Vendor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBids.map((bid) => (
                    <TableRow key={bid.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{bid.vendor_name}</p>
                            <p className="text-xs text-muted-foreground">{bid.vendor_company}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{bid.project_title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-success">${bid.bid_amount?.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span>{bid.vendor_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bid.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(bid.submitted_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(bid)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bid.status === 'submitted' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => shortlistBid(bid.id)}
                                className="text-info hover:text-info"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => bid.project_id && awardBid(bid.id, bid.project_id)}
                                className="text-success hover:text-success"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => rejectBid(bid.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid Detail Modal */}
      {selectedBid && (
        <BidDetailModal
          bid={selectedBid}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBid(null);
          }}
          onRequestInfo={requestInfo}
          onRequestDocs={requestDocuments}
          onShortlist={shortlistBid}
          onAward={awardBid}
          onReject={rejectBid}
        />
      )}
    </div>
  );
}
