import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LoginBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    async function bridgeLogin() {
      if (!access_token || !refresh_token) {
        toast.error("Invalid or missing tokens.");
        return navigate("/auth");
      }

      toast.loading("Authenticating...");

      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      toast.dismiss();

      if (error) {
        toast.error("Login link expired or invalid.");
        return navigate("/auth");
      }

      toast.success("Login successful!");
      navigate("/dashboard");
    }

    bridgeLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
        <p className="text-lg text-foreground font-medium">
          Signing you in securely...
        </p>
      </div>
    </div>
  );
}
