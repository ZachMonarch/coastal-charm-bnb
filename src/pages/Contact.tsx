import { useState } from "react";
import { Phone, Mail, MapPin, Send, Clock, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { contactSchema } from "@/lib/validation/contactSchema";
import { ZodError } from "zod";
import { pushSalesIQLead } from "@/lib/salesiq";

export default function Contact() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);
      
      // Simulate form submission with validated data
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Push contact submission to SalesIQ as a qualified lead
      pushSalesIQLead(
        {
          name: `${validatedData.firstName} ${validatedData.lastName}`.trim(),
          email: validatedData.email,
          phone: validatedData.phone || undefined,
          info: {
            subject: validatedData.subject,
            category: validatedData.category,
            message_preview: validatedData.message.slice(0, 140),
          },
        },
        'contact_form'
      );

      toast.success("Message sent successfully! We'll get back to you within 24 hours.");
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please correct the errors in the form");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Contact Us - Get in Touch"
        description="Contact Monarch Property Management for rentals, maintenance, or vendor inquiries. Franktown, CO. Call +1 (304) 365-8349."
        keywords={["contact property management", "rental inquiries", "property maintenance", "vendor services", "Franktown CO"]}
        type="website"
        url="https://monarch-properties.com/contact"
      />
      
      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden min-h-[35vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=600&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/80" />
        </div>
        <div className="container relative z-10 px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_0_4px_16px_rgb(0_0_0_/_90%)]">
            {t.contact?.title || 'Contact Us'}
          </h1>
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] font-medium [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
            {t.contact?.subtitle || 'Get in touch with our team'}
          </p>
        </div>
      </section>
      
      <div className="p-6" role="main" aria-label="Contact information and form">
        <div className="container mx-auto max-w-6xl">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <h2 className="sr-only">Contact information</h2>
              <Card className="neumorphic-card brand-teal-accent border-l-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-secondary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    2195 N. Highway 83 Suite 14B<br />
                    Franktown, CO 80116<br />
                    United States
                  </p>
                </CardContent>
              </Card>

              <Card className="neumorphic-card brand-teal-accent border-l-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-secondary" />
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    +1 (304) 365-8349
                  </p>
                  <p className="text-muted-foreground text-sm">
                    +1 (614) 427-8576
                  </p>
                </CardContent>
              </Card>

              <Card className="neumorphic-card brand-teal-accent border-l-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-secondary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    info@monarchpropertymmgt.online<br />
                    support@monarchpropertymmgt.online
                  </p>
                </CardContent>
              </Card>

              <Card className="neumorphic-card brand-teal-accent border-l-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-secondary" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  We'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-destructive' : ''}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    />
                    {errors.firstName && (
                      <p id="firstName-error" className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className={errors.lastName ? 'border-destructive' : ''}
                        required
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                      />
                      {errors.lastName && (
                        <p id="lastName-error" className="text-sm text-destructive mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      required
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 123-4567" 
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={errors.phone ? 'border-destructive' : ''}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="text-sm text-destructive mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Inquiry Type</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger id="category" aria-label="Inquiry type" className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property-management">Property Management</SelectItem>
                        <SelectItem value="rental-inquiry">Rental Inquiry</SelectItem>
                        <SelectItem value="maintenance">Maintenance Request</SelectItem>
                        <SelectItem value="vendor-services">Vendor Services</SelectItem>
                        <SelectItem value="general">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive mt-1">{errors.category}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="Brief description of your inquiry" 
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className={errors.subject ? 'border-destructive' : ''}
                      required
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? 'subject-error' : undefined}
                    />
                    {errors.subject && (
                      <p id="subject-error" className="text-sm text-destructive mt-1">{errors.subject}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Please provide details about your inquiry..." 
                      className={`min-h-[120px] ${errors.message ? 'border-destructive' : ''}`}
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      required
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="text-sm text-destructive mt-1">{errors.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}