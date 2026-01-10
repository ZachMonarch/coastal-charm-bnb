import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useAccessRequest, type RoleRequestType } from '@/hooks/useAccessRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Building2, 
  Briefcase, 
  Loader2, 
  Shield, 
  User, 
  Settings, 
  LogOut,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  role_requested: z.enum(['vendor', 'property_manager'], {
    required_error: 'Please select an account type'
  }),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().optional(),
  phone: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export function AccessGateOverlay() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { submitRequest, isSubmitting } = useAccessRequest();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role_requested: 'vendor',
      full_name: user?.user_metadata?.full_name || '',
      company_name: '',
      phone: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    const success = await submitRequest({
      role_requested: data.role_requested as RoleRequestType,
      full_name: data.full_name,
      company_name: data.company_name,
      phone: data.phone
    });

    if (success) {
      setSubmitted(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div data-access-gate className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-auto">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
        {/* Logo / Branding - FIXED: Light mode visibility */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-primary/10 mb-4">
            <Crown className="w-8 h-8 text-amber-700 dark:text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Monarch Property
          </h1>
          <p className="text-muted-foreground mt-1">
            Management Platform
          </p>
        </div>

        {!submitted ? (
          <Card className="shadow-xl border-border/50 bg-card backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-serif text-foreground">Request Account Access</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Select your account type to unlock full platform features. 
                An administrator will review your request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Role Selection */}
                  <FormField
                    control={form.control}
                    name="role_requested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Account Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-3"
                          >
                            <label
                              className={cn(
                                "relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:bg-primary/5",
                                field.value === 'vendor' 
                                  ? "border-primary bg-primary/5 shadow-sm" 
                                  : "border-border bg-background"
                              )}
                            >
                              <RadioGroupItem value="vendor" className="sr-only" />
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                field.value === 'vendor' ? "bg-primary/20" : "bg-muted"
                              )}>
                                <Briefcase className={cn(
                                  "h-5 w-5",
                                  field.value === 'vendor' ? "text-primary" : "text-muted-foreground"
                                )} />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm text-foreground">Vendor</p>
                                <p className="text-xs text-muted-foreground">Service provider</p>
                              </div>
                            </label>
                            <label
                              className={cn(
                                "relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:bg-primary/5",
                                field.value === 'property_manager' 
                                  ? "border-primary bg-primary/5 shadow-sm" 
                                  : "border-border bg-background"
                              )}
                            >
                              <RadioGroupItem value="property_manager" className="sr-only" />
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                field.value === 'property_manager' ? "bg-primary/20" : "bg-muted"
                              )}>
                                <Building2 className={cn(
                                  "h-5 w-5",
                                  field.value === 'property_manager' ? "text-primary" : "text-muted-foreground"
                                )} />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm text-foreground">Property Manager</p>
                                <p className="text-xs text-muted-foreground">Property management</p>
                              </div>
                            </label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your full name" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Company Name <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your company name" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Phone <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1 (555) 123-4567" 
                            type="tel" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium !text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      'Submit Access Request'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Footer Links */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Success State - Show Pending Approval */
          <Card className="shadow-xl border-border/50 bg-card backdrop-blur">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                Request Submitted Successfully!
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Your access request has been submitted. An administrator will review your request and you'll be notified once it's processed.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Estimated review time:</span> 1-2 business days
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/profile">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <User className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Button>
                </Link>
                <button onClick={handleSignOut}>
                  <Button variant="ghost" className="w-full sm:w-auto text-slate-600 dark:text-muted-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signed in as */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Signed in as <span className="font-medium">{user?.email}</span>
        </p>
      </div>
    </div>
  );
}