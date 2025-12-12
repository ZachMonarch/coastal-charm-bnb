import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const DEBUG = typeof window !== 'undefined' && localStorage.getItem('DEBUG_AUTH') === '1';

function debugLog(message: string, data?: any) {
  if (!DEBUG) return;
  console.log(`[AuthVerify] ${message}`, data ?? '');
}

/**
 * Universal Supabase verification handler.
 * Handles:
 * - Magic link login
 * - Password recovery
 * - Invite acceptance
 * - Email confirmation
 * - Signup confirmation
 */
export default function AuthVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Verifying your link...");

  useEffect(() => {
    async function handleVerification() {
      // Parse from both query string AND hash (Supabase uses both)
      const allParams = new URLSearchParams();
      
      // Query params
      new URLSearchParams(location.search).forEach((v, k) => allParams.set(k, v));
      
      // Hash params (Supabase often uses #access_token=...)
      const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
      if (hash) {
        new URLSearchParams(hash).forEach((v, k) => allParams.set(k, v));
      }

      const type = allParams.get("type") || "";
      const access_token = allParams.get("access_token") || "";
      const refresh_token = allParams.get("refresh_token") || "";
      const token = allParams.get("token") || ""; // OTP token format
      const error = allParams.get("error") || "";
      const errorCode = allParams.get("error_code") || "";
      const errorDescription = allParams.get("error_description") || "";

      debugLog('Verification params', {
        type,
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        hasToken: !!token,
        error,
        errorCode,
        hash: hash ? hash.substring(0, 50) + '...' : '',
        search: location.search
      });

      // Handle error responses from Supabase
      if (error) {
        const friendlyMessage = errorCode === 'otp_expired' 
          ? "This link has expired. Please request a new one."
          : errorDescription?.replace(/\+/g, ' ') || "Verification failed.";
        
        debugLog('Error in params', { error, errorCode, errorDescription });
        toast.error(friendlyMessage);
        setStatus("Link expired or invalid.");
        return navigate("/auth", { replace: true });
      }

      if (!access_token || !refresh_token) {
        debugLog('Missing tokens');
        toast.error("Invalid or expired verification link.");
        setStatus("Invalid or missing tokens.");
        return navigate("/auth", { replace: true });
      }

      try {
        setStatus("Establishing secure session...");
        
        // Clear any existing session first
        try {
          await supabase.auth.signOut();
          debugLog('Cleared existing session');
        } catch (e) {
          debugLog('Signout failed (non-critical)', e);
        }

        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          debugLog('Session error', sessionError);
          
          let errorMsg = "Unable to verify session.";
          if (sessionError.message?.includes('expired')) {
            errorMsg = "This link has expired. Please request a new one.";
          } else if (sessionError.message?.includes('invalid')) {
            errorMsg = "Invalid verification link. Please request a new one.";
          }
          
          toast.error(errorMsg);
          setStatus("Verification failed. Please request a new link.");
          return navigate("/auth", { replace: true });
        }

        debugLog('Session established', { userId: data?.user?.id, type });

        // Normalize type
        const normalizedType = type.toLowerCase();

        // Route by token type
        if (normalizedType.includes('recovery') || normalizedType === 'reset') {
          toast.info("Please set a new password.");
          setStatus("Redirecting to password reset...");
          window.history.replaceState({}, "", "/auth?reset=true");
          navigate("/auth?reset=true", { replace: true });
        } else if (normalizedType.includes('magic') || normalizedType === 'signin' || normalizedType === 'login') {
          toast.success("Login successful!");
          setStatus("Redirecting to your dashboard...");
          window.history.replaceState({}, "", "/dashboard");
          navigate("/dashboard", { replace: true });
        } else if (normalizedType.includes('invite')) {
          toast.success("Invite accepted!");
          setStatus("Redirecting...");
          window.history.replaceState({}, "", "/dashboard");
          navigate("/dashboard", { replace: true });
        } else if (normalizedType.includes('signup') || normalizedType === 'email_change' || normalizedType === 'verify') {
          toast.success("Email confirmed successfully!");
          setStatus("Redirecting...");
          window.history.replaceState({}, "", "/dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          // Default: treat as successful verification
          debugLog('Unknown type, defaulting to dashboard', type);
          toast.success("Verification successful!");
          setStatus("Redirecting...");
          window.history.replaceState({}, "", "/dashboard");
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        debugLog('Verification error', err);
        console.error("Verification error:", err);
        toast.error("Link verification failed.");
        setStatus("Error verifying link. Please log in manually.");
        navigate("/auth", { replace: true });
      }
    }

    handleVerification();
  }, [navigate, location.search, location.hash]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
      <div className="text-center p-8 rounded-lg shadow-lg bg-card/60 dark:bg-card/80 backdrop-blur-sm border border-border/30">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
          <img 
            src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png" 
            alt="Monarch Logo"
            className="absolute inset-0 m-auto h-6 w-6 rounded object-contain"
          />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {status}
        </h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we securely verify your credentials.
        </p>
        {DEBUG && (
          <p className="text-xs text-muted-foreground/60 mt-4">
            Debug mode enabled. Check console for details.
          </p>
        )}
      </div>
    </div>
  );
}
