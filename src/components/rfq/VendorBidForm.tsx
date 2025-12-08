import { useState } from 'react';
import { usePhase9RFQ } from '@/hooks/usePhase9RFQ';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RFQLot {
  id: string;
  lot_name: string;
  quantity: number;
  unit_of_measure: string;
  specifications?: any;
}

interface VendorBidFormProps {
  rfqId: string;
  lots: RFQLot[];
  onSuccess?: () => void;
}

export default function VendorBidForm({ rfqId, lots, onSuccess }: VendorBidFormProps) {
  const { submitBid } = usePhase9RFQ();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [bidLines, setBidLines] = useState<Record<string, number>>(
    lots.reduce((acc, lot) => ({ ...acc, [lot.id]: 0 }), {})
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedBidLines = lots.map(lot => ({
        rfq_lot_id: lot.id,
        unit_price: bidLines[lot.id] || 0,
        notes: `Unit price for ${lot.lot_name}`
      }));

      await submitBid({
        rfq_id: rfqId,
        bid_lines: formattedBidLines,
        notes
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting bid:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBidAmount = lots.reduce(
    (sum, lot) => sum + (bidLines[lot.id] || 0) * lot.quantity,
    0
  );

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Submit Your Bid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lots.map(lot => (
            <div key={lot.id} className="border-b border-border pb-4">
              <Label htmlFor={`lot-${lot.id}`} className="text-foreground font-medium">
                {lot.lot_name} ({lot.quantity} {lot.unit_of_measure})
              </Label>
              <Input
                id={`lot-${lot.id}`}
                type="number"
                step="0.01"
                placeholder="Unit price"
                value={bidLines[lot.id] || ''}
                onChange={(e) => setBidLines({ ...bidLines, [lot.id]: parseFloat(e.target.value) || 0 })}
                className="mt-2 bg-background border-2 border-input focus:border-primary text-foreground placeholder:text-muted-foreground"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Line total: ${((bidLines[lot.id] || 0) * lot.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <p className="text-lg font-semibold text-foreground">
              Total Bid Amount: <span className="text-primary">${totalBidAmount.toFixed(2)}</span>
            </p>
          </div>

          <div>
            <Label htmlFor="notes" className="text-foreground">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information about your bid..."
              className="mt-2 bg-background border-2 border-input focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || totalBidAmount === 0} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
