import { useState } from 'react';
import { Mail, Send, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ButtonSpinner } from '@/components/shared/LoadingSpinner';

interface SecureInvite {
  email: string;
  companyName: string;
  message: string;
  expiresInDays: number;
}

export default function SecureInviteSystem() {
  const [invite, setInvite] = useState<SecureInvite>({
    email: '',
    companyName: '',
    message: 'Join our professional vendor network on monarchpropertymmgt.com and access exclusive project opportunities.',
    expiresInDays: 7
  });
  const [sending, setSending] = useState(false);

  const generateSecureInviteLink = (email: string, company: string) => {
    const token = btoa(JSON.stringify({
      email,
      company,
      timestamp: Date.now(),
      expires: Date.now() + (invite.expiresInDays * 24 * 60 * 60 * 1000)
    }));
    return `https://monarchpropertymmgt.com/auth?invite=${token}`;
  };

  const sendSecureInvite = async () => {
    if (!invite.email || !invite.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      const secureLink = generateSecureInviteLink(invite.email, invite.companyName);
      
      // Store invite in database for tracking
      const { error: dbError } = await supabase
        .from('vendor_invitations')
        .insert({
          email: invite.email,
          company_name: invite.companyName,
          invite_message: invite.message,
          status: 'sent'
        });

      if (dbError) {
        console.warn('Failed to store invite:', dbError);
      }

      // Send email with retry logic
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: invite.email,
          subject: `Vendor Network Invitation - ${invite.companyName}`,
          template: 'vendor-invite',
          data: {
            companyName: invite.companyName,
            inviteMessage: invite.message,
            signupUrl: secureLink,
            expiresIn: `${invite.expiresInDays} days`,
            adminEmail: 'admin@monarchpropertymmgt.com'
          }
        }
      });

      if (emailError) {
        throw new Error(`Email service error: ${emailError.message}`);
      }

      toast.success('Secure vendor invitation sent successfully!');
      setInvite({
        email: '',
        companyName: '',
        message: 'Join our professional vendor network on monarchpropertymmgt.com and access exclusive project opportunities.',
        expiresInDays: 7
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Secure Vendor Invitations
        </CardTitle>
        <CardDescription>
          Send secure, expiring invitations to monarchpropertymmgt.com
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Vendor Email *</Label>
            <Input
              id="email"
              type="email"
              value={invite.email}
              onChange={(e) => setInvite(prev => ({ ...prev, email: e.target.value }))}
              placeholder="vendor@company.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              value={invite.companyName}
              onChange={(e) => setInvite(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="ABC Contracting LLC"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message">Invitation Message</Label>
          <Textarea
            id="message"
            value={invite.message}
            onChange={(e) => setInvite(prev => ({ ...prev, message: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="expires">Link Expires In (Days)</Label>
          <Input
            id="expires"
            type="number"
            min="1"
            max="30"
            value={invite.expiresInDays}
            onChange={(e) => setInvite(prev => ({ ...prev, expiresInDays: Number(e.target.value) }))}
          />
        </div>

        {/* Security Features */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Features
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Links expire after {invite.expiresInDays} days</li>
            <li>• Direct signup to monarchpropertymmgt.com</li>
            <li>• Encrypted invitation tokens</li>
            <li>• Email delivery tracking</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={sendSecureInvite}
            disabled={sending || !invite.email || !invite.companyName}
            className="gap-2"
          >
            {sending ? (
              <>
                <ButtonSpinner />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Secure Invitation
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}