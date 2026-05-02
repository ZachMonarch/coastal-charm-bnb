import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRFQAccess } from '@/hooks/useRFQAccess';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface Props {
  rfqId: string;
  rfqTitle: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function RequestRFQAccessDialog({ rfqId, rfqTitle, open, onOpenChange }: Props) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { submitRequest, isSubmitting, request } = useRFQAccess(rfqId);

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [message, setMessage] = useState('');
  const [qualifications, setQualifications] = useState('');

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to request access</DialogTitle>
            <DialogDescription>
              Create a free account to request access to <strong>{rfqTitle}</strong>. Once approved by the admin, you can view the full project and submit a bid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => navigate(`/auth?redirect=/rfq/${rfqId}`)}>Sign up / Sign in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async () => {
    const ok = await submitRequest({
      full_name: fullName,
      company_name: companyName,
      phone,
      message,
      qualifications,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request access to project</DialogTitle>
          <DialogDescription>
            Submit a brief Request for Information (RFI) for <strong>{rfqTitle}</strong>. The admin will review and grant access.
          </DialogDescription>
        </DialogHeader>

        {request?.status === 'pending' && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            You already have a pending request submitted on {new Date(request.created_at).toLocaleDateString()}.
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company name *</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="qualifications">Relevant qualifications / experience</Label>
            <Textarea id="qualifications" rows={3} value={qualifications} onChange={(e) => setQualifications(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Why are you interested in this project? *</Label>
            <Textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !companyName || !phone || !message}
          >
            {isSubmitting ? 'Submitting…' : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
