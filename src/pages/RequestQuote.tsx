import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Helmet } from "react-helmet-async";
import { 
  ArrowRight, CheckCircle2, Loader2, Clock, Shield, 
  Zap, MapPin, DollarSign, Calendar, Phone, Mail, User
} from "lucide-react";

const SERVICE_CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "Painting", "Landscaping",
  "General Contracting", "Roofing", "Cleaning", "Security",
  "Moving", "Carpentry", "Flooring", "Appliance Repair", "Pest Control",
];

const quoteSchema = z.object({
  serviceCategory: z.string().min(1, "Please select a service category"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (min 20 characters)"),
  urgency: z.enum(["urgent", "normal", "flexible"]),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  preferredStartDate: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().min(2, "City is required"),
  locationZip: z.string().min(5, "Zip code is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  contactEmail: z.string().email("Valid email required"),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function RequestQuote() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      serviceCategory: "",
      title: "",
      description: "",
      urgency: "normal",
      budgetMin: "",
      budgetMax: "",
      preferredStartDate: "",
      locationAddress: "",
      locationCity: "",
      locationZip: "",
      contactName: "",
      contactPhone: "",
      contactEmail: user?.email || "",
    },
  });

  const onSubmit = async (data: QuoteFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('quick_quote_requests')
        .insert({
          property_manager_id: user?.id || null,
          service_category: data.serviceCategory,
          title: data.title,
          description: data.description,
          urgency: data.urgency,
          budget_min: data.budgetMin ? parseFloat(data.budgetMin) : null,
          budget_max: data.budgetMax ? parseFloat(data.budgetMax) : null,
          preferred_start_date: data.preferredStartDate || null,
          location_address: data.locationAddress,
          location_city: data.locationCity,
          location_zip: data.locationZip,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          status: 'open',
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Quote request submitted! Vendors will respond shortly.");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Quote Request Submitted | Monarch Property Management</title>
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full text-center">
            <CardContent className="pt-10 pb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground mb-3">
                Quote Request Submitted!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your request has been sent to verified vendors in your area. 
                Expect responses within 2-4 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/vendors")}>
                  Browse Vendors
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Request a Quote | Monarch Property Management</title>
        <meta name="description" content="Get free quotes from verified service providers. Fast response times from trusted plumbers, electricians, contractors and more." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-12 bg-gradient-to-br from-primary/10 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-3 h-3 mr-1" />
                Free Quotes in 2-4 Hours
              </Badge>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Get Quotes from <span className="text-primary">Verified Vendors</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Describe your project and receive competitive quotes from trusted service providers
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-8 border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Shield, text: "Verified Vendors" },
                { icon: Clock, text: "Fast Response" },
                { icon: DollarSign, text: "Free to Request" },
                { icon: CheckCircle2, text: "No Obligation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-muted-foreground">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Describe Your Project</CardTitle>
                <CardDescription>
                  Fill out the details below and qualified vendors will contact you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Service Category */}
                    <FormField
                      control={form.control}
                      name="serviceCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Kitchen sink repair needed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Details *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe the work needed, any issues, preferences..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Urgency & Budget Row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="urgency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Urgency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="urgent">Urgent (ASAP)</SelectItem>
                                <SelectItem value="normal">Normal (This week)</SelectItem>
                                <SelectItem value="flexible">Flexible</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferredStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Start Date</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="date" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Budget Range */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Min ($)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="number" placeholder="0" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Max ($)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="number" placeholder="5000" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Service Location
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="locationAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123 Main Street" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="locationCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="City" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="locationZip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="12345" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Contact Information
                      </h3>

                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Smith" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone *</FormLabel>
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
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input {...field} type="email" placeholder="email@example.com" className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Get Free Quotes
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
