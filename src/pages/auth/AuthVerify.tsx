import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw, Mail } from "lucide-react";

/**
 * AuthVerify: Handles token_hash verification from email links
 * Used when Custom SMTP is enabled in Supabase - links use token_hash instead of access_token
 * 
 * URL format: /auth/verify?token_hash=xxx&type=recovery|signup|magiclink
 */

const DEBUG = typeof window !== 'undefined' && localStorage.getItem('DEBUG_AUTH') === '1';

function debugLog(message: string, data?: any) {
  if (!DEBUG) return;
  console.log(`[AuthVerify] ${message}`, data ?? '');
}

type VerifyStatus = 'verifying' | 'success' | 'error' | 'expired';

interface VerifyState {
  status: VerifyStatus;
  message: string;
  email?: string;
}

function useVerifyParams() {
  const location = useLocation();
  
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    
    // Also check hash for fallback
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    if (hash) {
      new URLSearchParams(hash).forEach((v, k) => {
        if (!params.has(k)) params.set(k, v);
      });
    }
    
    const token_hash = params.get("token_hash") || "";
    const token = params.get("token") || "";
    const typeRaw = (params.get("type") || "").toLowerCase();
    const error = params.get("error") || "";
    const errorDescription = params.get("error_description") || "";
    const errorCode = params.get("error_code") || "";
    
    // Normalize type
    const type = typeRaw.includes("recovery") ? "recovery"
      : typeRaw.includes("magic") ? "magiclink"
      : typeRaw.includes("signup") ? "signup"
      : typeRaw.includes("email") ? "email_change"
      : typeRaw || "signup";
    
    debugLog('Parsed verify params', { 
      token_hash: token_hash ? '***' : '', 
      token: token ? '***' : '',
      type,
      error,
      errorCode
    });
    
    return { token_hash, token, type, error, errorDescription, errorCode };
  }, [location.search, location.hash]);
}

export default function AuthVerify() {
  const navigate = useNavigate();
  const { token_hash, token, type, error, errorDescription, errorCode } = useVerifyParams();
  const [state, setState] = useState<VerifyState>({
    status: 'verifying',
    message: 'Verifying your email link...'
  });
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      debugLog('Starting verification', { type, hasTokenHash: !!token_hash, hasToken: !!token });
      
      // Handle error params from Supabase
      if (error || errorCode) {
        const isExpired = errorCode === 'otp_expired' || 
                         errorDescription?.toLowerCase().includes('expired') ||
                         error?.toLowerCase().includes('expired');
        
        setState({
          status: isExpired ? 'expired' : 'error',
          message: isExpired 
            ? 'This link has expired. Please request a new one.'
            : errorDescription?.replace(/\+/g, ' ') || 'Verification failed. Please try again.'
        });
        return;
      }
      
      // No token to verify
      if (!token_hash && !token) {
        debugLog('No token found, redirecting to auth');
        navigate("/auth", { replace: true });
        return;
      }
      
      try {
        // Use verifyOtp for token_hash (Custom SMTP flow)
        if (token_hash) {
          debugLog('Verifying with token_hash', { type });
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'recovery' | 'signup' | 'magiclink' | 'email_change' | 'invite',
          });
          
          if (verifyError) {
            debugLog('Verification error', verifyError);
            
            const isExpired = verifyError.message?.toLowerCase().includes('expired') ||
                             verifyError.message?.toLowerCase().includes('invalid');
            
            setState({
              status: isExpired ? 'expired' : 'error',
              message: isExpired 
                ? 'This link has expired or is invalid. Please request a new one.'
                : verifyError.message || 'Verification failed.'
            });
            return;
          }
          
          debugLog('Verification successful', { userId: data?.user?.id, type });
          
          // Handle different verification types
          if (type === 'recovery') {
            setState({
              status: 'success',
              message: 'Email verified! Redirecting to reset password...'
            });
            toast.info("Please set a new password.");
            setTimeout(() => {
              navigate("/auth?reset=true", { replace: true });
            }, 1500);
          } else if (type === 'signup') {
            setState({
              status: 'success',
              message: 'Email confirmed! Redirecting to sign in...'
            });
            toast.success("Email confirmed! You can now sign in.");
            setTimeout(() => {
              navigate("/auth?mode=signin", { replace: true });
            }, 1500);
          } else {
            // magiclink or other - go to dashboard
            setState({
              status: 'success',
              message: 'Verified! Redirecting to dashboard...'
            });
            toast.success("Signed in successfully!");
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          }
          
        } else if (token) {
          // Fallback for old token format (shouldn't happen with Custom SMTP)
          debugLog('Using legacy token format');
          navigate(`/auth/callback?token=${token}&type=${type}`, { replace: true });
        }
        
      } catch (err: any) {
        debugLog('Unexpected error', err);
        console.error("AuthVerify error:", err);
        setState({
          status: 'error',
          message: 'An unexpected error occurred. Please try again.'
        });
      }
    };
    
    verifyToken();
  }, [token_hash, token, type, error, errorDescription, errorCode, navigate]);

  const handleResendLink = async () => {
    if (!resendEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsResending(true);
    try {
      if (type === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          resendEmail.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/auth/verify` }
        );
        if (error) throw error;
        toast.success("Password reset link sent! Check your email.");
      } else {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: resendEmail.trim().toLowerCase(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`
          }
        });
        if (error) throw error;
        toast.success("Verification link sent! Check your email.");
      }
      setState(prev => ({ ...prev, status: 'verifying', message: 'New link sent! Check your email.' }));
    } catch (err: any) {
      toast.error(err.message || "Failed to send link. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const getIcon = () => {
    switch (state.status) {
      case 'verifying':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
        );
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'expired':
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border border-border bg-card/95 backdrop-blur-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-xl text-foreground">
            {state.status === 'verifying' && 'Verifying...'}
            {state.status === 'success' && 'Verified!'}
            {state.status === 'expired' && 'Link Expired'}
            {state.status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {state.message}
          </CardDescription>
        </CardHeader>
        
        {(state.status === 'expired' || state.status === 'error') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="resend-email" className="text-sm font-medium text-foreground">
                Enter your email to request a new link
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="resend-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            
            <Button
              onClick={handleResendLink}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {type === 'recovery' ? 'Send Password Reset Link' : 'Resend Verification Link'}
                </span>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate("/auth", { replace: true })}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        )}
        
        {DEBUG && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground/60 text-center">
              Debug mode enabled. Check console for details.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
