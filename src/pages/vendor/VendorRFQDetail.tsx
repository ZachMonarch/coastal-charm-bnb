import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useRFQSubscription } from '@/hooks/useRFQSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import VendorBidForm from '@/components/rfq/VendorBidForm';
import { RFQTimeline } from '@/components/rfq/shared/RFQTimeline';
import EMDPayToUnlockGate from '@/components/rfq/EMDPayToUnlockGate';

export default function VendorRFQDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useRFQSubscription(id);

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['rfq', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          id,
          title,
          description,
          status,
          deadline,
          created_at,
          property:properties(id, title, address, city),
          rfq_lots(
            id,
            lot_name,
            quantity,
            unit_of_measure,
            specifications
          )
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: myBid } = useQuery({
    queryKey: ['vendor-bid', id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bid_lines')
        .select('id, unit_price, submitted_at')
        .eq('vendor_id', user?.id)
        .in('rfq_lot_id', rfq?.rfq_lots?.map((lot: any) => lot.id) || [])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!rfq?.rfq_lots && !!user?.id,
  });

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (!rfq) {
    return <div className="container mx-auto py-6">RFQ not found</div>;
  }

  const timelineEvents = [
    {
      label: 'RFQ Created',
      date: rfq.created_at,
      completed: true,
    },
    {
      label: 'Invitation Sent',
      completed: true,
    },
    {
      label: 'Bid Submission',
      current: !myBid && rfq.status === 'open',
      completed: !!myBid,
      date: myBid?.submitted_at,
    },
    {
      label: 'Bid Review',
      current: !!myBid && rfq.status === 'open',
      completed: rfq.status !== 'open',
    },
    {
      label: 'Contract Award',
      completed: rfq.status === 'awarded',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate('/vendor/rfqs')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{rfq.title}</h1>
          <p className="text-muted-foreground">
            {rfq.property?.title} - {rfq.property?.address}
          </p>
        </div>
        <RFQStatusBadge status={rfq.status as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>RFQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{rfq.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Property Information</h3>
                <p className="text-muted-foreground">
                  {rfq.property?.title}<br />
                  {rfq.property?.address}<br />
                  {rfq.property?.city}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Deadline</h3>
                <p className="text-muted-foreground">
                  {new Date(rfq.deadline).toLocaleString('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {!myBid && rfq.status === 'open' ? (
            <VendorBidForm
              rfqId={rfq.id}
              lots={rfq.rfq_lots || []}
              onSuccess={() => navigate('/vendor/rfqs')}
            />
          ) : myBid ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Bid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You submitted a bid on {new Date(myBid.submitted_at).toLocaleString()}
                </p>
                <p className="text-lg font-semibold mt-2">
                  Status: {rfq.status === 'awarded' ? 'Under Review' : 'Pending'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>RFQ Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This RFQ is no longer accepting bids.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <RFQTimeline events={timelineEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
