import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * LoginBridge: Handles authentication tokens from magic links, password reset, and invites
 * Parses tokens from URL query/hash, establishes session, and redirects appropriately
 */
function useAuthParams() {
  const location = useLocation();
  
  const all = new URLSearchParams();
  
  // Parse query params
  new URLSearchParams(location.search).forEach((v, k) => all.set(k, v));
  
  // Parse hash params (#access_token=...)
  const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
  if (hash) {
    new URLSearchParams(hash).forEach((v, k) => all.set(k, v));
  }
  
  const access_token = all.get("access_token") || "";
  const refresh_token = all.get("refresh_token") || "";
  const typeRaw = (all.get("type") || "").toLowerCase();
  
  // Normalize token types
  const type = typeRaw.includes("recovery") ? "recovery"
    : typeRaw.includes("magic") ? "magiclink"
    : typeRaw.includes("invite") ? "invite"
    : typeRaw.includes("signup") ? "signup"
    : typeRaw;
  
  const resetFlag = all.get("reset") === "true" || type === "recovery";
  
  return { access_token, refresh_token, type, resetFlag };
}

export default function LoginBridge() {
  const navigate = useNavigate();
  const { access_token, refresh_token, type, resetFlag } = useAuthParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const run = async () => {
      // No tokens = redirect to auth
      if (!access_token || !refresh_token) {
        navigate("/auth", { replace: true });
        return;
      }

      try {
        // Clear any existing session
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signout errors
        }

        // Establish new session with tokens
        const { error } = await supabase.auth.setSession({ 
          access_token, 
          refresh_token 
        });

        if (error) {
          toast.error("Authentication failed. Please request a new link.");
          navigate("/auth", { replace: true });
          return;
        }

        // Handle password reset flow
        if (resetFlag) {
          toast.info("Please set a new password to continue.");
          window.history.replaceState({}, "", "/auth?reset=true");
          navigate("/auth?reset=true", { replace: true });
          return;
        }

        // Success - redirect to dashboard
        toast.success("Signed in successfully!");
        const destination = type === "magiclink" || type === "invite" || type === "signup" 
          ? "/dashboard" 
          : "/dashboard";
        
        window.history.replaceState({}, "", destination);
        navigate(destination, { replace: true });

      } catch (error: any) {
        console.error("LoginBridge error:", error);
        toast.error("Unexpected error during authentication.");
        navigate("/auth", { replace: true });
      }
    };

    run().finally(() => setProcessing(false));
  }, [access_token, refresh_token, type, resetFlag, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <div className="text-sm text-muted-foreground">
          {processing ? "Processing secure link…" : "Redirecting…"}
        </div>
      </div>
    </div>
  );
}
