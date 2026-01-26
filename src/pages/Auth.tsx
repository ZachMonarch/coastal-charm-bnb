import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Eye, EyeOff, LogIn, UserPlus, Building2, Shield, User, Wrench, Lock, Mail, Phone, Briefcase } from "lucide-react";
import { getRoleHomeRouteForRoles } from "@/lib/roleRoutes";
import { AuthHeroSection } from "@/components/auth/AuthHeroSection";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { getEmailRedirectUrl, getPasswordResetRedirectUrl, logAuthConfig } from "@/utils/authRedirects";

function useAuthParams() {
  const location = useLocation();

  return useMemo(() => {
    const all = new URLSearchParams();
    const qs = new URLSearchParams(location.search);
    qs.forEach((v, k) => all.set(k, v));
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    if (hash) {
      const hs = new URLSearchParams(hash);
      hs.forEach((v, k) => all.set(k, v));
    }

    const access_token = all.get("access_token") || "";
    const refresh_token = all.get("refresh_token") || "";
    const typeRaw = (all.get("type") || "").toLowerCase();

    const type = typeRaw.includes("recovery")
      ? "recovery"
      : typeRaw.includes("magic")
        ? "magiclink"
        : typeRaw.includes("invite")
          ? "invite"
          : typeRaw.includes("signup")
            ? "signup"
            : typeRaw.includes("email_change")
              ? "email_change"
              : typeRaw.includes("reauth")
                ? "reauthentication"
                : typeRaw;

    const loginFlag = all.get("login") === "true";
    const resetFlag = all.get("reset") === "true" || type === "recovery";

    return { access_token, refresh_token, type, loginFlag, resetFlag };
  }, [location.search, location.hash]);
}

export default function Auth() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [processingRedirect, setProcessingRedirect] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("tenant"); // Default to tenant, used only for URL params
  const [companyName, setCompanyName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  const navigate = useNavigate();
  const location = useLocation();
  const { access_token, refresh_token, type, loginFlag, resetFlag } = useAuthParams();

  useEffect(() => {
    let cancelled = false;

    const handleRedirectTokens = async () => {
      if (!access_token || !refresh_token) {
        setProcessingRedirect(false);
        return;
      }

      setProcessingRedirect(true);

      try {
        try {
          await supabase.auth.signOut();
        } catch { /* ignore */ }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          toast.error(error.message || "Failed to establish session from magic link.");
          setProcessingRedirect(false);
          return;
        }

        if (resetFlag) {
          setIsResettingPassword(true);
          toast.info("Please set a new password to continue.");
          window.history.replaceState({}, "", "/auth?reset=true");
        } else {
          toast.success("Signed in successfully!");
          window.history.replaceState({}, "", "/auth");
          navigate("/dashboard", { replace: true });
        }
      } catch (e: any) {
        toast.error(e?.message || "Unexpected error during magic link handling.");
      } finally {
        if (!cancelled) setProcessingRedirect(false);
      }
    };

    void handleRedirectTokens();
    return () => { cancelled = true; };
  }, [access_token, refresh_token, resetFlag, loginFlag, type, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    const companyParam = params.get("company");
    const roleParam = params.get("role");
    const modeParam = params.get("mode");

    if (emailParam && !email) setEmail(decodeURIComponent(emailParam));
    if (companyParam && !companyName) setCompanyName(decodeURIComponent(companyParam));
    if (roleParam && !role) setRole(decodeURIComponent(roleParam));

    // Ensure correct tab is shown for explicit auth mode
    if (modeParam === "signup") {
      setActiveTab("signup");
    } else if (modeParam === "signin") {
      setActiveTab("signin");
    }
  }, [location.search, email, companyName, role]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !isResettingPassword && !processingRedirect) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, authLoading, isResettingPassword, processingRedirect, navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated successfully!");
      setIsResettingPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      try {
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
            localStorage.removeItem(key);
          }
        });
      } catch { /* ignore */ }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please check your credentials.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email address before signing in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Successfully signed in!");
        try {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id);
          
          const roles = (rolesData || [])
            .map(r => r.role)
            .filter((role): role is 'admin' | 'property_manager' | 'vendor' | 'tenant' => 
              ['admin', 'property_manager', 'vendor', 'tenant'].includes(role)
            );
          
          const homeRoute = roles.length > 0 ? getRoleHomeRouteForRoles(roles) : '/dashboard';
          navigate(homeRoute, { replace: true });
        } catch {
          navigate("/dashboard", { replace: true });
        }
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Use centralized redirect URL helper for consistent https:// protocol
      const redirectUrl = getEmailRedirectUrl('/auth/verify');
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Log auth config in dev mode for debugging
      logAuthConfig();

      // Note: Users always start as 'tenant' regardless of what they select
      // The database trigger will auto-create an access request if they want vendor/property_manager
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), // Normalize email to lowercase
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone?.trim() || null,
            // Role is stored for access request purposes only - NOT for direct assignment
            role: 'tenant', // Always send tenant - privileged roles require admin approval
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          toast.success("Account created! You can now sign in. Request additional access from your dashboard.");
        } else {
          toast.success("Account created! Please check your email to confirm, then request access from your dashboard.");
        }

        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
        setPhone("");
        setCompanyName("");
        setRole("property_manager");
        setActiveTab("signin");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case "admin": return <Shield className="h-5 w-5" />;
      case "property_manager": return <Building2 className="h-5 w-5" />;
      case "vendor": return <Wrench className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getRoleDescription = (roleType: string) => {
    switch (roleType) {
      case "property_manager": return "Manage properties and tenants";
      case "vendor": return "Bid on projects and provide services";
      case "tenant": return "Access portal and submit requests";
      default: return "";
    }
  };

  if (authLoading || processingRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
            <img 
              src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png" 
              alt="Monarch Logo"
              className="absolute inset-0 m-auto h-8 w-8 rounded object-contain"
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="text-muted-foreground font-medium">
            {processingRedirect ? "Processing secure link…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (isResettingPassword) {
    return (
      <div className="min-h-screen flex bg-background dark:bg-background">
        <AuthHeroSection activeRole="property_manager" />
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
          <Card className="w-full max-w-md shadow-xl border border-border bg-card/95 dark:bg-card/90 backdrop-blur-md">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Reset Password</CardTitle>
              <CardDescription className="text-muted-foreground">Create a new secure password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 bg-input border-border text-foreground"
                  />
                  <PasswordStrengthMeter password={newPassword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 bg-input border-border text-foreground"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90 !text-white" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background dark:bg-background">
      {/* Hero Section - Left Side */}
      <AuthHeroSection activeRole={role} />

      {/* Auth Form - Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
        <div className="w-full max-w-md">
          {/* Mobile logo - only show on small screens */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png" 
                alt="Monarch Logo"
                className="h-14 w-14 rounded-xl shadow-lg border border-border object-contain bg-card"
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
              />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-foreground">MONARCH</h1>
                <p className="text-primary text-sm font-medium">Property Management</p>
              </div>
            </div>
          </div>

          <Card className="border border-border shadow-2xl bg-card/95 dark:bg-card/90 backdrop-blur-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList variant="grid" className="grid w-full grid-cols-2 m-4 mr-8">
                <TabsTrigger value="signin" variant="grid" className="gap-2 py-3 text-base">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" variant="grid" className="gap-2 py-3 text-base">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <CardHeader className="space-y-1 pb-4 pt-2">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription>Sign in to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 h-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-12 text-base font-semibold rounded-md inline-flex items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-60 shadow-md transition-colors"
                      disabled={isLoading}
                      style={{ 
                        backgroundColor: 'hsl(32, 80%, 40%)', 
                        color: '#ffffff',
                        WebkitTextFillColor: '#ffffff'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span 
                            className="animate-spin rounded-full h-4 w-4 border-2" 
                            style={{ borderColor: '#ffffff', borderTopColor: 'transparent' }} 
                          />
                          <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Signing in...</span>
                        </>
                      ) : <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Sign In</span>}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!email) {
                            toast.error("Please enter your email address");
                            return;
                          }
                          setIsLoading(true);
                          try {
                            // Use centralized redirect URL helper
                            const resetRedirectUrl = getPasswordResetRedirectUrl();
                            console.log('[Auth] Password reset redirect URL:', resetRedirectUrl);
                            
                            const { error } = await supabase.auth.resetPasswordForEmail(
                              email.trim().toLowerCase(), // Normalize email
                              { redirectTo: resetRedirectUrl }
                            );
                            if (error) toast.error(error.message);
                            else toast.success("Password reset link sent to your email!");
                          } catch {
                            toast.error("Failed to send reset email");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <CardHeader className="space-y-1 pb-4 pt-2">
                  <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                  <CardDescription>Join our property management platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstname">First Name</Label>
                        <Input
                          id="firstname"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastname">Last Name</Label>
                        <Input
                          id="lastname"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 h-11"
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                      <PasswordStrengthMeter password={password} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    {/* Access Request Info Banner */}
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Note:</span> All new accounts start with basic access. 
                        After signing up, you can request vendor or property manager access from your dashboard, 
                        which will be reviewed by an administrator.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-primary shadow-md hover:bg-primary/90"
                      style={{ color: 'white' }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2" style={{ color: 'white' }}>
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Creating Account...
                        </span>
                      ) : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-[#8B5A2B] dark:text-primary font-semibold hover:underline">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-[#8B5A2B] dark:text-primary font-semibold hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
