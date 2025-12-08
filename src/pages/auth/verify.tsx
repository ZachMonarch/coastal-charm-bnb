import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Universal Supabase verification handler.
 * Handles:
 * - Magic link login
 * - Password recovery
 * - Invite acceptance
 * - Email confirmation
 */
export default function AuthVerify() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your link...");

  useEffect(() => {
    async function handleVerification() {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        toast.error("Invalid or expired verification link.");
        setStatus("Invalid or missing tokens.");
        return navigate("/auth", { replace: true });
      }

      try {
        setStatus("Restoring session...");
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error("Session restoration error:", error.message);
          toast.error("Unable to verify session.");
          setStatus("Verification failed. Please request a new link.");
          return navigate("/auth", { replace: true });
        }

        // 🎯 Route by token type
        switch (type) {
          case "magiclink":
          case "magiclink_token":
          case "signin":
          case "login":
            toast.success("Login successful!");
            setStatus("Redirecting to your dashboard...");
            navigate("/dashboard", { replace: true });
            break;

          case "recovery":
          case "recovery_token":
          case "reset":
            toast.info("Please reset your password.");
            setStatus("Redirecting to password reset...");
            navigate(`/auth?reset=true&access_token=${access_token}&refresh_token=${refresh_token}`, { replace: true });
            break;

          case "invite":
          case "invite_token":
            toast.success("Invite accepted!");
            setStatus("Redirecting...");
            navigate("/dashboard", { replace: true });
            break;

          case "email_change":
          case "verify":
            toast.success("Email confirmed successfully!");
            setStatus("Redirecting...");
            navigate("/dashboard", { replace: true });
            break;

          default:
            console.warn("Unknown token type:", type);
            setStatus("Authentication verified.");
            navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error("Link verification failed.");
        setStatus("Error verifying link. Please log in manually.");
        navigate("/auth", { replace: true });
      }
    }

    handleVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
      <div className="text-center p-8 rounded-lg shadow-lg bg-card/60 dark:bg-card/80 backdrop-blur-sm border border-border/30">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {status}
        </h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we securely verify your credentials.
        </p>
      </div>
    </div>
  );
}
