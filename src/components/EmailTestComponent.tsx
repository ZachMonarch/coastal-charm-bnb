import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send } from 'lucide-react';
import { ButtonSpinner } from '@/components/shared/LoadingSpinner';

export default function EmailTestComponent() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const testEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Test Email from Monarch Property Management',
          template: 'test',
          data: {
            name: 'Test User',
            message: 'This is a test email to verify the email system is working correctly.'
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Test email sent successfully!"
      });
    } catch (error) {
      console.error('Email test error:', error);
      toast({
        title: "Error",
        description: "Failed to send test email. Please check console for details.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button 
          onClick={testEmail} 
          disabled={sending || !email}
          className="w-full gap-2"
        >
          {sending ? (
            <ButtonSpinner />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {sending ? 'Sending...' : 'Send Test Email'}
        </Button>
      </CardContent>
    </Card>
  );
}