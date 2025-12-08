import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, 
  Mail, Phone, User, Building2, MapPin
} from "lucide-react";

const SERVICE_CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "Painting", "Landscaping",
  "General Contracting", "Roofing", "Cleaning", "Security",
  "Moving", "Carpentry", "Flooring", "Appliance Repair", "Pest Control"
];

// Step 1: Basic Info
const step1Schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Step 2: Business Info
const step2Schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  serviceCategories: z.array(z.string()).min(1, "Select at least one service"),
});

// Step 3: Service Areas
const step3Schema = z.object({
  serviceAreas: z.array(z.string()).min(1, "Add at least one service area"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface VendorQuickSignupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VendorQuickSignup({ open, onOpenChange }: VendorQuickSignupProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({
    serviceCategories: [],
    serviceAreas: [],
  });
  const [newServiceArea, setNewServiceArea] = useState("");

  // Step 1 Form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      phone: formData.phone || "",
      password: formData.password || "",
    },
  });

  // Step 2 Form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      companyName: formData.companyName || "",
      serviceCategories: formData.serviceCategories || [],
    },
  });

  // Step 3 Form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      serviceAreas: formData.serviceAreas || [],
      agreeToTerms: formData.agreeToTerms || false,
    },
  });

  const handleStep1Submit = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(3);
  };

  const handleAddServiceArea = () => {
    if (newServiceArea.trim()) {
      const currentAreas = step3Form.getValues("serviceAreas") || [];
      if (!currentAreas.includes(newServiceArea.trim())) {
        step3Form.setValue("serviceAreas", [...currentAreas, newServiceArea.trim()]);
      }
      setNewServiceArea("");
    }
  };

  const handleRemoveServiceArea = (area: string) => {
    const currentAreas = step3Form.getValues("serviceAreas") || [];
    step3Form.setValue("serviceAreas", currentAreas.filter(a => a !== area));
  };

  const handleFinalSubmit = async (data: Step3Data) => {
    setLoading(true);
    
    try {
      const finalData = { ...formData, ...data };
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalData.email!,
        password: finalData.password!,
        options: {
          emailRedirectTo: `${window.location.origin}/vendor/onboarding`,
          data: {
            full_name: finalData.fullName,
            role: 'vendor',
          },
        },
      });

      if (authError) throw authError;
      
      if (authData.user) {
        // 2. Create vendor profile
        const { error: profileError } = await supabase
          .from('vendor_profiles')
          .insert({
            user_id: authData.user.id,
            company_name: finalData.companyName!,
            specialties: finalData.serviceCategories!,
            service_areas: finalData.serviceAreas!,
            phone: finalData.phone,
            email: finalData.email,
            subscription_status: 'trial',
            subscription_plan: 'basic',
            is_verified: false,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw - user is created, they can complete profile later
        }

        // 3. Assign vendor role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'vendor',
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
        }
      }

      toast.success("Account created! Please check your email to verify.");
      onOpenChange(false);
      
      // Reset form
      setStep(1);
      setFormData({ serviceCategories: [], serviceAreas: [] });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message?.includes('already registered')) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceCategory = (category: string) => {
    const current = step2Form.getValues("serviceCategories") || [];
    if (current.includes(category)) {
      step2Form.setValue("serviceCategories", current.filter(c => c !== category));
    } else {
      step2Form.setValue("serviceCategories", [...current, category]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby="vendor-signup-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">
            {step === 1 && "Create Your Account"}
            {step === 2 && "Your Services"}
            {step === 3 && "Service Areas"}
          </DialogTitle>
          <DialogDescription id="vendor-signup-description">
            {step === 1 && "Join Monarch's network of trusted service providers"}
            {step === 2 && "Select the services you offer"}
            {step === 3 && "Where do you provide services?"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s < step ? 'bg-primary text-primary-foreground' :
                s === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <FormField
                control={step1Form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="John Smith" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step1Form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="john@company.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step1Form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="(555) 123-4567" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step1Form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Min 8 characters" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <FormField
                control={step2Form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="Smith Plumbing LLC" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step2Form.control}
                name="serviceCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services Offered</FormLabel>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {SERVICE_CATEGORIES.map((category) => (
                        <div
                          key={category}
                          onClick={() => toggleServiceCategory(category)}
                          className={`px-3 py-2 rounded-md border cursor-pointer text-sm transition-colors ${
                            field.value?.includes(category)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card hover:bg-muted border-border'
                          }`}
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 3: Service Areas */}
        {step === 3 && (
          <Form {...step3Form}>
            <form onSubmit={step3Form.handleSubmit(handleFinalSubmit)} className="space-y-4">
              <FormField
                control={step3Form.control}
                name="serviceAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Areas (Cities or Zip Codes)</FormLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={newServiceArea}
                          onChange={(e) => setNewServiceArea(e.target.value)}
                          placeholder="Enter city or zip code"
                          className="pl-10"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddServiceArea();
                            }
                          }}
                        />
                      </div>
                      <Button type="button" variant="secondary" onClick={handleAddServiceArea}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((area) => (
                        <Badge 
                          key={area} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveServiceArea(area)}
                        >
                          {area} ×
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={step3Form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        I agree to the{" "}
                        <a href="/terms" target="_blank" className="text-primary underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" target="_blank" className="text-primary underline">
                          Privacy Policy
                        </a>
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Sign In Link */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          Already have an account?{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary"
            onClick={() => {
              onOpenChange(false);
              navigate('/auth');
            }}
          >
            Sign in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
