import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

interface NewsletterSubscriptionProps {
  variant?: "card" | "inline";
  className?: string;
}

export function NewsletterSubscription({ variant = "card", className }: NewsletterSubscriptionProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [subscribed, setSubscribed] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .upsert({
          email: email.toLowerCase().trim(),
          user_id: user?.id || null,
          subscription_type: frequency,
          is_active: true,
          confirmed_at: new Date().toISOString()
        }, {
          onConflict: "email"
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setSubscribed(true);
      toast.success("Successfully subscribed to the newsletter!");
    },
    onError: (error: Error) => {
      toast.error(`Subscription failed: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    subscribeMutation.mutate();
  };

  if (subscribed) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="h-12 w-12 text-success mb-4" />
          <h3 className="text-xl font-semibold mb-2">You're Subscribed!</h3>
          <p className="text-muted-foreground">
            Thank you for subscribing. You'll receive {frequency} property news updates at {email}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={subscribeMutation.isPending}>
          {subscribeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Subscribe
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Property News Newsletter
        </CardTitle>
        <CardDescription>
          Stay informed with the latest property management news and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newsletter-email">Email Address</Label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal cursor-pointer">Daily Digest</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">Weekly Roundup (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">Monthly Summary</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full" disabled={subscribeMutation.isPending}>
            {subscribeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Subscribe to Newsletter
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By subscribing, you agree to receive property news updates. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
