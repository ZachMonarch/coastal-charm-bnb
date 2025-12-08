import { useState } from 'react';
import { usePhase9RFQ } from '@/hooks/usePhase9RFQ';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award } from 'lucide-react';

interface ContractAwardProps {
  rfqId: string;
  vendorId: string;
  vendorName: string;
  bidAmount: number;
  onSuccess?: () => void;
}

export default function ContractAward({ 
  rfqId, 
  vendorId, 
  vendorName, 
  bidAmount,
  onSuccess 
}: ContractAwardProps) {
  const { awardContract } = usePhase9RFQ();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contract_value: bidAmount,
    start_date: '',
    end_date: ''
  });

  const handleAward = async () => {
    if (!formData.start_date || !formData.end_date) return;

    setLoading(true);
    try {
      await awardContract({
        rfq_id: rfqId,
        vendor_id: vendorId,
        contract_value: formData.contract_value,
        start_date: formData.start_date,
        end_date: formData.end_date
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error awarding contract:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Award className="w-4 h-4 mr-2" />
          Award Contract
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award Contract</DialogTitle>
          <DialogDescription>
            Award contract to {vendorName} for ${bidAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="contract_value">Contract Value</Label>
            <Input
              id="contract_value"
              type="number"
              step="0.01"
              value={formData.contract_value}
              onChange={(e) => setFormData({ ...formData, contract_value: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <Button 
            onClick={handleAward} 
            disabled={loading || !formData.start_date || !formData.end_date}
            className="w-full"
          >
            {loading ? 'Awarding Contract...' : 'Confirm Award'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
