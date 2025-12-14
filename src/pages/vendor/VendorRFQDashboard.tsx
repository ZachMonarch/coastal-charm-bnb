import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useVendorBidsSubscription } from '@/hooks/useRFQSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHeroWithImage from '@/components/shared/PageHeroWithImage';
import StatsCard from '@/components/shared/StatsCard';
import DashboardChart from '@/components/shared/DashboardChart';
import EmptyStateIllustration from '@/components/shared/EmptyStateIllustration';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';

export default function VendorRFQDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useVendorBidsSubscription(user?.id);

  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['vendor-invites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_invites')
        .select(`
          id,
          status,
          invited_at,
          rfq:rfqs(
            id,
            title,
            description,
            status,
            deadline,
            property:properties(title, address)
          )
        `)
        .eq('vendor_id', user?.id)
        .eq('status', 'invited')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: myBids, isLoading: loadingBids } = useQuery({
    queryKey: ['vendor-bids', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bid_lines')
        .select(`
          id,
          unit_price,
          submitted_at,
          rfq_lot:rfq_lots(
            id,
            lot_name,
            quantity,
            rfq:rfqs(id, title, status, deadline)
          )
        `)
        .eq('vendor_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const pendingReview = myBids?.filter((bid: any) => bid.rfq_lot?.rfq?.status === 'open').length || 0;

  // Generate bid activity chart data
  const bidActivityData = useMemo(() => {
    if (!myBids || myBids.length === 0) return [];
    
    const monthlyData: Record<string, number> = {};
    myBids.forEach((bid: any) => {
      const date = new Date(bid.submitted_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .slice(-6)
      .map(([name, value]) => ({ name, value }));
  }, [myBids]);

  return (
    <PrivatePageWrapper title="RFQ Dashboard" showFooter={true}>
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="primary" intensity="subtle" showOrbs>
        <div className="container mx-auto py-6 space-y-6">
          <PageHeroWithImage
            title="RFQ Dashboard"
            description="View invitations and manage your bids for property management projects"
            icon={Briefcase}
            backgroundImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80"
            compact
            height="md"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Open Invitations"
              value={invitations?.length || 0}
              icon={FileText}
              color="info"
              animated
            />
            <StatsCard
              title="Active Bids"
              value={myBids?.length || 0}
              icon={DollarSign}
              color="success"
              animated
            />
            <StatsCard
              title="Pending Review"
              value={pendingReview}
              icon={Clock}
              color="warning"
              animated
            />
          </div>

          {/* Bid Activity Chart */}
          {bidActivityData.length > 0 && (
            <DashboardChart
              title="Bid Activity"
              description="Your bidding activity over time"
              data={bidActivityData}
              type="bar"
              color="primary"
              height={220}
            />
          )}

      <Card>
        <CardHeader>
          <CardTitle>Open Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvitations ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-4">
              {invitations.map((invite: any) => (
                <Card key={invite.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{invite.rfq?.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {invite.rfq?.property?.title} - {invite.rfq?.property?.address}
                        </p>
                      </div>
                      <RFQStatusBadge status={invite.rfq?.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{invite.rfq?.description?.substring(0, 200)}...</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Deadline: {new Date(invite.rfq?.deadline).toLocaleDateString()}
                      </div>
                      <Button onClick={() => navigate(`/vendor/rfqs/${invite.rfq?.id}`)}>
                        Submit Bid
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyStateIllustration
              type="documents"
              title="No open invitations"
              description="You'll see RFQ invitations here when property managers invite you to bid on projects."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Bids</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBids ? (
            <div className="text-center py-8">Loading bids...</div>
          ) : myBids && myBids.length > 0 ? (
            <div className="space-y-4">
              {myBids.map((bid: any) => (
                <div key={bid.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{bid.rfq_lot?.rfq?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(bid.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {bid.rfq_lot?.rfq?.status || 'pending'}
                    </Badge>
                    <p className="text-sm font-semibold mt-1">
                      ${(bid.unit_price * (bid.rfq_lot?.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateIllustration
              type="projects"
              title="No bids submitted yet"
              description="Start bidding on RFQ invitations to see your submission history here."
            />
          )}
        </CardContent>
      </Card>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
