import { useState } from 'react';
import { useScoringWeights, useSaveScoringWeights, DEFAULT_WEIGHTS } from '@/hooks/useScoringWeights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sliders, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props { rfqId: string }

export default function RFQScoringWeightsEditor({ rfqId }: Props) {
  const { data, isLoading } = useScoringWeights(rfqId);
  const save = useSaveScoringWeights();
  const [w, setW] = useState<any>(null);

  const current = w ?? data ?? { rfq_id: rfqId, ...DEFAULT_WEIGHTS };
  const total = Number(current.price_weight) + Number(current.delivery_weight) + Number(current.compliance_weight) + Number(current.experience_weight) + Number(current.quality_weight);

  const update = (k: string, v: number) => setW({ ...current, [k]: v });

  const handleSave = () => {
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Weights must total 100 (current: ${total})`);
      return;
    }
    save.mutate(current);
  };

  if (isLoading) return <Card><CardContent className="py-8">Loading…</CardContent></Card>;

  const fields: Array<[string, string]> = [
    ['price_weight', 'Price'],
    ['delivery_weight', 'Delivery / Timeline'],
    ['compliance_weight', 'Compliance & Verification'],
    ['experience_weight', 'Experience'],
    ['quality_weight', 'Quality / Rating'],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5" /> Scoring Engine Weights</CardTitle>
        <CardDescription>Configure how vendor bids are ranked. Total must equal 100.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(([k, label]) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={k}>{label}</Label>
              <Input id={k} type="number" min={0} max={100} step={1}
                value={current[k]}
                onChange={(e) => update(k, Number(e.target.value))} />
            </div>
          ))}
        </div>
        <div className={`text-sm font-medium ${Math.abs(total - 100) < 0.01 ? 'text-success' : 'text-destructive'}`}>
          Total: {total} / 100
        </div>
        <Button onClick={handleSave} disabled={save.isPending}>
          <Save className="h-4 w-4 mr-2" /> Save Weights
        </Button>
      </CardContent>
    </Card>
  );
}
