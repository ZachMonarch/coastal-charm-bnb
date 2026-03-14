import { useState } from "react";
import { Plus, Mail, Send, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import SecureInviteSystem from "./SecureInviteSystem";

interface VendorInvite {
  email: string;
  companyName: string;
  specialties: string[];
  inviteMessage: string;
}

export default function AdminVendorInvite() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [invite, setInvite] = useState<VendorInvite>({
    email: '',
    companyName: '',
    specialties: [],
    inviteMessage: 'Welcome to our vendor network! Please sign up using the link below to start receiving project opportunities.'
  });

  const specialtyOptions = [
    'Plumbing', 'Electrical', 'HVAC', 'Landscaping', 'Cleaning', 
    'General Maintenance', 'Renovation', 'Painting', 'Roofing', 
    'Flooring', 'Appliance Repair', 'Pest Control'
  ];

  const sendVendorInvite = async () => {
    if (!invite.email || !invite.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      // Create secure signup link to monarchpropertymmgt.online
      const mainDomain = 'https://monarchpropertymmgt.online';
      const signupUrl = `${mainDomain}/auth?email=${encodeURIComponent(invite.email)}&role=vendor&company=${encodeURIComponent(invite.companyName)}&invite=true`;
      
      // Send email via edge function with proper structure and retry logic
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: invite.email,
          subject: `Vendor Network Invitation - ${invite.companyName}`,
          template: 'vendor-invite',
          data: {
            companyName: invite.companyName,
            specialties: invite.specialties,
            inviteMessage: invite.inviteMessage,
            signupUrl,
            adminEmail: 'admin@monarchpropertymmgt.online',
            expiresIn: '7 days' // Secure expiring link
          }
        }
      });

      if (emailError) {
        logger.error('Email error:', emailError);
        throw emailError;
      }

      toast.success('Vendor invitation sent successfully!');
      setIsInviteOpen(false);
      resetInvite();
    } catch (error) {
      logger.error('Error sending vendor invite:', error);
      toast.error('Failed to send vendor invitation');
    } finally {
      setSending(false);
    }
  };

  const resetInvite = () => {
    setInvite({
      email: '',
      companyName: '',
      specialties: [],
      inviteMessage: 'Welcome to our vendor network! Please sign up using the link below to start receiving project opportunities.'
    });
  };

  const toggleSpecialty = (specialty: string) => {
    setInvite(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <div className="space-y-6">
      <SecureInviteSystem />
      
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Legacy Vendor Invitations
        </CardTitle>
        <CardDescription>
          Alternative invitation method (for testing only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Vendor Invitation
              </DialogTitle>
              <DialogDescription>
                Invite a new vendor to join your platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
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

              {/* Specialties */}
              <div>
                <Label>Specialties</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {specialtyOptions.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={specialty}
                        checked={invite.specialties.includes(specialty)}
                        onChange={() => toggleSpecialty(specialty)}
                        className="rounded border-border"
                      />
                      <Label htmlFor={specialty} className="text-sm font-normal">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <Label htmlFor="message">Invitation Message</Label>
                <Textarea
                  id="message"
                  value={invite.inviteMessage}
                  onChange={(e) => setInvite(prev => ({ ...prev, inviteMessage: e.target.value }))}
                  placeholder="Personalize your invitation message"
                  rows={4}
                />
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Preview
                </h4>
                <div className="text-sm space-y-2">
                  <p><strong>To:</strong> {invite.email || 'vendor@company.com'}</p>
                  <p><strong>Subject:</strong> Vendor Invitation - {invite.companyName || 'Your Company'}</p>
                  <div className="mt-3 p-3 bg-background rounded border">
                    <p>Dear {invite.companyName || 'Vendor'},</p>
                    <p className="mt-2">{invite.inviteMessage}</p>
                    {invite.specialties.length > 0 && (
                      <p className="mt-2">
                        <strong>Relevant specialties:</strong> {invite.specialties.join(', ')}
                      </p>
                    )}
                    <p className="mt-3">
                      <Button variant="outline" size="sm" disabled>
                        Sign Up as Vendor
                      </Button>
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Best regards,<br />
                      Monarch Property Management Team
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const { error } = await supabase.functions.invoke('send-email', {
                        body: {
                          to: 'test@example.com',
                          subject: 'Test Email from Monarch Property Management',
                          html: '<p>This is a test email. If you receive this, the email service is working correctly!</p>'
                        }
                      });
                      
                      if (error) {
                        toast.error('Email test failed: ' + error.message);
                      } else {
                        toast.success('Test email sent successfully! Check test@example.com inbox.');
                      }
                    } catch (error) {
                      toast.error('Email service error: ' + (error as Error).message);
                    }
                  }}
                >
                  Test Email Service
                </Button>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={sendVendorInvite}
                  disabled={sending || !invite.email || !invite.companyName}
                  className="gap-2"
                >
                {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="p-2 bg-info/10 rounded-lg">
              <Send className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium">Invitations Sent</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium">Vendors Joined</p>
              <p className="text-xs text-muted-foreground">From invites</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium">Pending</p>
              <p className="text-xs text-muted-foreground">Awaiting signup</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}