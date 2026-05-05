import { useEMD, useStartEMDPayment } from '@/hooks/useEMD';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle2, DollarSign } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  rfqId: string;
  requiresEmd: boolean;
  emdAmountCents: number;
  children: ReactNode;
}

export default function EMDPayToUnlockGate({ rfqId, requiresEmd, emdAmountCents, children }: Props) {
  const { user } = useAuth();
  const { data: emd, isLoading } = useEMD(rfqId, user?.id);
  const start = useStartEMDPayment();

  if (!requiresEmd) return <>{children}</>;
  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Checking EMD status…</div>;

  if (emd?.status === 'held') {
    return (
      <>
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>EMD of ${(emd.amount_cents / 100).toFixed(2)} held — full project unlocked</span>
        </div>
        {children}
      </>
    );
  }

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" /> EMD Required to View Full Project
        </CardTitle>
        <CardDescription>
          Pay the Earnest Money Deposit to unlock the complete project scope and submit a bid.
          EMD is refundable on bid loss and forfeited only on default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-4">
          <span className="font-medium">EMD Amount</span>
          <span className="text-2xl font-bold">${(emdAmountCents / 100).toFixed(2)}</span>
        </div>
        <Button size="lg" className="w-full" onClick={() => start.mutate(rfqId)} disabled={start.isPending}>
          <DollarSign className="h-4 w-4 mr-2" />
          {start.isPending ? 'Redirecting…' : 'Pay EMD & Unlock'}
        </Button>
      </CardContent>
    </Card>
  );
}
