import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAuthBaseUrl, isValidRedirectUrl } from "@/utils/authRedirects";
import OptimizedLogo from "@/components/ui/OptimizedLogo";

/**
 * LoginBridge: Handles authentication tokens from magic links, password reset, and invites
 * Parses tokens from URL query/hash, establishes session, and redirects appropriately
 * 
 * Debug: Set localStorage.DEBUG_AUTH = '1' to enable verbose logging
 */

const DEBUG = typeof window !== 'undefined' && localStorage.getItem('DEBUG_AUTH') === '1';

function debugLog(message: string, data?: any) {
  if (!DEBUG) return;
  console.log(`[LoginBridge] ${message}`, data ?? '');
}

function useAuthParams() {
  const location = useLocation();
  
  return useMemo(() => {
    const all = new URLSearchParams();
    
    // Parse query params
    new URLSearchParams(location.search).forEach((v, k) => all.set(k, v));
    
    // Parse hash params (#access_token=...) - Supabase often puts tokens here
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    if (hash) {
      new URLSearchParams(hash).forEach((v, k) => all.set(k, v));
    }
    
    // Also check for error params in hash (e.g., #error=access_denied)
    const error = all.get("error") || "";
    const errorCode = all.get("error_code") || "";
    const errorDescription = all.get("error_description") || "";
    
    const access_token = all.get("access_token") || "";
    const refresh_token = all.get("refresh_token") || "";
    const token = all.get("token") || ""; // Some flows use 'token' instead
    const token_hash = all.get("token_hash") || ""; // Custom SMTP flow uses token_hash
    const typeRaw = (all.get("type") || "").toLowerCase();
    
    // Normalize token types
    const type = typeRaw.includes("recovery") ? "recovery"
      : typeRaw.includes("magic") ? "magiclink"
      : typeRaw.includes("invite") ? "invite"
      : typeRaw.includes("signup") ? "signup"
      : typeRaw.includes("email") ? "email_change"
      : typeRaw;
    
    const resetFlag = all.get("reset") === "true" || type === "recovery";
    
    debugLog('Parsed auth params', { 
      access_token: access_token ? '***' : '', 
      refresh_token: refresh_token ? '***' : '',
      token: token ? '***' : '',
      token_hash: token_hash ? '***' : '',
      type, 
      resetFlag,
      error,
      errorCode,
      errorDescription,
      fullHash: hash ? hash.substring(0, 50) + '...' : '',
      fullSearch: location.search
    });
    
    return { 
      access_token, 
      refresh_token, 
      token,
      token_hash,
      type, 
      resetFlag,
      error,
      errorCode,
      errorDescription
    };
  }, [location.search, location.hash]);
}

export default function LoginBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    access_token, 
    refresh_token, 
    token,
    token_hash,
    type, 
    resetFlag,
    error,
    errorCode,
    errorDescription
  } = useAuthParams();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState("Processing secure link…");

  useEffect(() => {
    const run = async () => {
      // Detect malformed Supabase redirects (missing https:// in redirect_to)
      const pathname = window.location.pathname;
      const fullUrl = window.location.href;
      
      if (pathname.includes('monarchpropertymmgt.com') || 
          fullUrl.includes('.supabase.co/monarchpropertymmgt.com')) {
        debugLog('Malformed redirect detected', { pathname, fullUrl });
        console.error('[LoginBridge] Malformed Supabase redirect URL detected. Check Supabase Dashboard URL configuration.');
        toast.error("Authentication configuration error. Please contact support.");
        navigate("/auth", { replace: true });
        return;
      }
      
      debugLog('Starting LoginBridge flow', { 
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        hasToken: !!token,
        hasTokenHash: !!token_hash,
        type,
        resetFlag,
        error,
        pathname,
        hash: location.hash ? location.hash.substring(0, 50) : ''
      });

      // If we have token_hash, redirect to AuthVerify which handles verifyOtp
      if (token_hash && !access_token) {
        debugLog('Token hash detected, redirecting to AuthVerify');
        const params = new URLSearchParams({ token_hash, type });
        navigate(`/auth/verify?${params.toString()}`, { replace: true });
        return;
      }

      // Handle error responses from Supabase (e.g., expired links)
      if (error) {
        const friendlyMessage = errorCode === 'otp_expired' 
          ? "This link has expired. Please request a new one."
          : errorDescription?.replace(/\+/g, ' ') || "Authentication failed.";
        
        debugLog('Error in URL params', { error, errorCode, errorDescription });
        toast.error(friendlyMessage);
        navigate("/auth", { replace: true });
        return;
      }

      // No tokens = redirect to auth
      if (!access_token || !refresh_token) {
        debugLog('Missing tokens, redirecting to /auth');
        navigate("/auth", { replace: true });
        return;
      }

      setStatus("Establishing secure session…");

      try {
        // Clear any existing session to prevent conflicts
        try {
          await supabase.auth.signOut();
          debugLog('Cleared existing session');
        } catch (e) {
          debugLog('Signout failed (non-critical)', e);
        }

        // Establish new session with tokens
        debugLog('Setting session with tokens');
        const { data, error: sessionError } = await supabase.auth.setSession({ 
          access_token, 
          refresh_token 
        });

        if (sessionError) {
          debugLog('Session error', sessionError);
          
          // Provide specific error messages
          let errorMsg = "Authentication failed.";
          if (sessionError.message?.includes('expired')) {
            errorMsg = "This link has expired. Please request a new one.";
          } else if (sessionError.message?.includes('invalid')) {
            errorMsg = "Invalid authentication link. Please request a new one.";
          }
          
          toast.error(errorMsg);
          navigate("/auth", { replace: true });
          return;
        }

        debugLog('Session established', { userId: data?.user?.id });
        setStatus("Redirecting…");

        // Handle password reset flow
        if (resetFlag) {
          debugLog('Password reset flow detected');
          toast.info("Please set a new password to continue.");
          window.history.replaceState({}, "", "/auth?reset=true");
          navigate("/auth?reset=true", { replace: true });
          return;
        }

        // Success - redirect to dashboard
        toast.success("Signed in successfully!");
        const destination = "/dashboard";
        
        debugLog('Redirecting to', destination);
        window.history.replaceState({}, "", destination);
        navigate(destination, { replace: true });

      } catch (err: any) {
        debugLog('Unexpected error', err);
        console.error("LoginBridge error:", err);
        toast.error("Unexpected error during authentication. Please try again.");
        navigate("/auth", { replace: true });
      }
    };

    run().finally(() => setProcessing(false));
  }, [access_token, refresh_token, token, token_hash, type, resetFlag, error, errorCode, errorDescription, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <OptimizedLogo size="sm" />
          </div>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {status}
        </div>
        {DEBUG && (
          <div className="text-xs text-muted-foreground/60 max-w-xs text-center">
            Debug mode enabled. Check console for details.
          </div>
        )}
      </div>
    </div>
  );
}
