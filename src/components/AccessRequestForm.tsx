import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAccessRequest, type RoleRequestType } from '@/hooks/useAccessRequest';
import { Building2, Briefcase, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  role_requested: z.enum(['vendor', 'property_manager'], {
    required_error: 'Please select a role'
  }),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().optional(),
  phone: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface AccessRequestFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function AccessRequestForm({ onSuccess, className }: AccessRequestFormProps) {
  const { 
    existingRequest, 
    isLoading, 
    isSubmitting, 
    submitRequest,
    hasPendingRequest,
    hasApprovedRequest,
    hasRejectedRequest
  } = useAccessRequest();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role_requested: 'vendor',
      full_name: '',
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

    if (success && onSuccess) {
      onSuccess();
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-lg mx-auto", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show status if request exists
  if (existingRequest) {
    return (
      <Card className={cn("w-full max-w-lg mx-auto", className)}>
        <CardHeader className="text-center">
          {hasPendingRequest && (
            <>
              <Clock className="h-12 w-12 text-warning mx-auto mb-4" />
              <CardTitle>Request Pending</CardTitle>
              <CardDescription>
                Your access request for <strong>{existingRequest.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'}</strong> access is being reviewed by our team.
              </CardDescription>
            </>
          )}
          {hasApprovedRequest && (
            <>
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <CardTitle>Request Approved!</CardTitle>
              <CardDescription>
                Your {existingRequest.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'} access has been approved. Please refresh the page to access your new features.
              </CardDescription>
            </>
          )}
          {hasRejectedRequest && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Request Not Approved</CardTitle>
              <CardDescription>
                {existingRequest.admin_notes || 'Your request was not approved at this time. Please contact support for more information.'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}</p>
          {existingRequest.reviewed_at && (
            <p>Reviewed: {new Date(existingRequest.reviewed_at).toLocaleDateString()}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-lg mx-auto", className)}>
      <CardHeader className="text-center">
        <CardTitle>Request Account Access</CardTitle>
        <CardDescription>
          Select the account type you need to access full features. An admin will review your request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role_requested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                      <label
                        className={cn(
                          "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                          field.value === 'vendor' ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <RadioGroupItem value="vendor" className="sr-only" />
                        <Briefcase className={cn(
                          "h-8 w-8",
                          field.value === 'vendor' ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div className="text-center">
                          <p className="font-semibold">Vendor</p>
                          <p className="text-xs text-muted-foreground">Service provider access</p>
                        </div>
                      </label>
                      <label
                        className={cn(
                          "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                          field.value === 'property_manager' ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <RadioGroupItem value="property_manager" className="sr-only" />
                        <Building2 className={cn(
                          "h-8 w-8",
                          field.value === 'property_manager' ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div className="text-center">
                          <p className="font-semibold">Property Manager</p>
                          <p className="text-xs text-muted-foreground">Property management access</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormDescription>
                    If you represent a business
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
