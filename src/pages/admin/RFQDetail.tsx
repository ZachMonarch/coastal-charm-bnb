import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRFQSubscription } from '@/hooks/useRFQSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, FileText, Pencil, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import { BidAmountDisplay } from '@/components/rfq/shared/BidAmountDisplay';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ContractAward from '@/components/contracts/ContractAward';
import BidSummary from '@/components/rfq/BidSummary';

export default function RFQDetail() {
  const { id } = useParams<{ id: string }>();
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
          ),
          rfq_invites(
            id,
            status,
            invited_at,
            vendor:profiles(id, full_name, email)
          )
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: bids } = useQuery({
    queryKey: ['bids', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bid_lines')
        .select(`
          id,
          vendor_id,
          unit_price,
          notes,
          submitted_at,
          vendor:profiles(id, full_name, email),
          rfq_lot:rfq_lots(id, lot_name, quantity)
        `)
        .in('rfq_lot_id', rfq?.rfq_lots?.map((lot: any) => lot.id) || []);

      if (error) throw error;

      // Group bids by vendor
      const grouped = data.reduce((acc: any, bid: any) => {
        const vendorId = bid.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendor_id: vendorId,
            vendor_name: bid.vendor?.full_name,
            vendor_email: bid.vendor?.email,
            bids: [],
            total: 0,
          };
        }
        const total = bid.unit_price * (bid.rfq_lot?.quantity || 1);
        acc[vendorId].bids.push({ ...bid, total });
        acc[vendorId].total += total;
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!rfq?.rfq_lots && rfq.rfq_lots.length > 0,
  });

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (!rfq) {
    return <div className="container mx-auto py-6">RFQ not found</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin/rfq')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to RFQs
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Date(rfq.deadline).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rfq.rfq_lots?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bids Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bids?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{rfq.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Lots ({rfq.rfq_lots?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfq.rfq_lots?.map((lot: any) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.lot_name}</TableCell>
                  <TableCell>{lot.quantity}</TableCell>
                  <TableCell>{lot.unit_of_measure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bids Received ({bids?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bids && bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map((bid: any) => (
                <Card key={bid.vendor_id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{bid.vendor_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{bid.vendor_email}</p>
                      </div>
                      <div className="text-right">
                        <BidAmountDisplay amount={bid.total} size="lg" />
                        {rfq.status === 'open' && (
                          <div className="mt-2">
                            <ContractAward
                              rfqId={rfq.id}
                              vendorId={bid.vendor_id}
                              vendorName={bid.vendor_name}
                              bidAmount={bid.total}
                              onSuccess={() => navigate('/admin/contracts')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BidSummary bids={bid.bids} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No bids received yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
