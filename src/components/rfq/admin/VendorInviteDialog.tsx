import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VendorInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfqId: string;
  rfqTitle: string;
}

export function VendorInviteDialog({ open, onOpenChange, rfqId, rfqTitle }: VendorInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter vendor email');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: { user } } = await supabase.auth.getUser();

      // Try to find existing vendor profile (site user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      let vendorName = profile?.full_name || normalizedEmail;
      let vendorIdToInvite: string | null = null;
      let isSiteVendor = false;

      if (profile) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .eq('role', 'vendor')
          .maybeSingle();

        if (roleData) {
          vendorIdToInvite = profile.id;
          isSiteVendor = true;
        }
      }

      // Create invite (site vendor → vendor_id; otherwise email-only)
      const { error: inviteError } = await supabase
        .from('rfq_invites')
        .insert({
          rfq_id: rfqId,
          vendor_id: vendorIdToInvite,
          invitee_email: isSiteVendor ? null : normalizedEmail,
          invited_by: user?.id,
          status: 'invited',
        });

      if (inviteError) throw inviteError;

      // Send invitation email (works for both registered and non-registered)
      const { error: emailError } = await supabase.functions.invoke('send-rfq-invitation', {
        body: {
          rfqId,
          rfqTitle,
          vendorEmail: normalizedEmail,
          vendorName,
          message: message.trim() || undefined,
        },
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        toast.warning('Invite created but email failed to send');
      } else {
        toast.success(
          isSiteVendor
            ? `Invitation sent to ${vendorName}`
            : `External invitation emailed to ${normalizedEmail}`
        );
      }

      setEmail('');
      setMessage('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Vendor to RFQ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rfq-title">RFQ</Label>
            <Input id="rfq-title" value={rfqTitle} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-email">Vendor Email *</Label>
            <Input
              id="vendor-email"
              type="email"
              placeholder="vendor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Registered vendors get an in-app invite. Unknown emails receive an external invitation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
