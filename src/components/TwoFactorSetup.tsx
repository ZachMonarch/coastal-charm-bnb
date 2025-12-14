import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  CheckCircle, 
  Copy, 
  Loader2,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type SetupStep = 'intro' | 'qr' | 'verify' | 'success';

export default function TwoFactorSetup({ open, onOpenChange, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('intro');
      setFactorId(null);
      setQrCode(null);
      setSecret(null);
      setVerificationCode('');
      setError(null);
    }
  }, [open]);

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Enroll a new TOTP factor
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (enrollError) {
        throw enrollError;
      }

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('qr');
      }
    } catch (err: any) {
      console.error('Error enrolling MFA:', err);
      setError(err.message || 'Failed to set up two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a challenge for the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) {
        throw challengeError;
      }

      // Verify the challenge with the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) {
        throw verifyError;
      }

      setStep('success');
      toast.success('Two-factor authentication enabled successfully!');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error verifying MFA:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success('Secret key copied to clipboard');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Protect Your Account</h3>
              <p className="text-muted-foreground text-sm">
                Two-factor authentication adds an extra layer of security to your account by requiring a code from your authenticator app when signing in.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">You'll need:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  An authenticator app (Google Authenticator, Authy, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  Ability to scan a QR code or enter a secret key
                </li>
              </ul>
            </div>

            <Button onClick={handleStartSetup} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue Setup'
              )}
            </Button>
          </div>
        );

      case 'qr':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="mb-2">Step 1 of 2</Badge>
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <p className="text-muted-foreground text-sm">
                Open your authenticator app and scan the QR code below
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img 
                    src={qrCode} 
                    alt="QR Code for 2FA" 
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={secret || ''} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copySecret}
                  title="Copy secret key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              I've Scanned the Code
            </Button>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="mb-2">Step 2 of 2</Badge>
              <h3 className="text-lg font-semibold">Enter Verification Code</h3>
              <p className="text-muted-foreground text-sm">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setVerificationCode(value);
                  setError(null);
                }}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('qr')} 
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                onClick={handleVerify} 
                className="flex-1"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">2FA Enabled!</h3>
              <p className="text-muted-foreground text-sm">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You'll need your authenticator app to sign in from now on. Make sure you have a backup method to access your account.
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Secure your account with an authenticator app
          </DialogDescription>
        </DialogHeader>
        
        {renderStep()}

        {error && step === 'intro' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}