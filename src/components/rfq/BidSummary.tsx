import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BidLine {
  id: string;
  vendor_id: string;
  unit_price: number;
  notes?: string;
  submitted_at: string;
}

interface BidSummaryProps {
  bids: BidLine[];
  vendorName?: string;
}

export default function BidSummary({ bids, vendorName }: BidSummaryProps) {
  const totalAmount = bids.reduce((sum, bid) => sum + bid.unit_price, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bid Summary</span>
          {vendorName && <Badge variant="secondary">{vendorName}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bids.map((bid, index) => (
          <div key={bid.id} className="flex justify-between items-center border-b pb-2">
            <span className="text-sm">Line {index + 1}</span>
            <span className="font-semibold">${bid.unit_price.toFixed(2)}</span>
          </div>
        ))}
        
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Bid Amount:</span>
            <span className="text-lg font-bold text-primary">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {bids[0]?.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Submitted: {new Date(bids[0].submitted_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
