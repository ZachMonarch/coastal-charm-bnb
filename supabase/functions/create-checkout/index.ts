import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { isPaymentsConfigured, paymentsDisabledResponse } from "../_shared/stripeConfig.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Input validation schema
const CheckoutRequestSchema = z.object({
  type: z.enum(['booking', 'vendor_payment', 'subscription']),
  amount: z.number().positive().max(1000000),
  currency: z.string().length(3).optional().default('usd'),
  bookingId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
  subscriptionTier: z.enum(['basic', 'professional', 'enterprise']).optional(),
  successUrl: z.string().url().max(2000).optional(),
  cancelUrl: z.string().url().max(2000).optional(),
  metadata: z.record(z.string()).optional()
}).refine(
  (data) => {
    if (data.type === 'booking' && !data.bookingId) return false;
    if (data.type === 'vendor_payment' && !data.paymentId) return false;
    if (data.type === 'subscription' && !data.subscriptionTier) return false;
    return true;
  },
  {
    message: "Missing required field for payment type"
  }
);

interface CheckoutRequest {
  type: 'booking' | 'vendor_payment' | 'subscription';
  amount: number;
  currency?: string;
  bookingId?: string;
  paymentId?: string;
  subscriptionTier?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);
  if (!isPaymentsConfigured()) {
    return paymentsDisabledResponse(corsHeaders);
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const requestBody = await req.json();
    const validationResult = CheckoutRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      type,
      currency,
      bookingId,
      paymentId,
      subscriptionTier,
      successUrl,
      cancelUrl,
      metadata = {}
    } = validationResult.data;

    // SECURITY: the charged amount is NEVER taken from the request body.
    // It is resolved server-side from the owning record (or the fixed price
    // book for subscriptions) so a client cannot manipulate the price.
    let amount = 0;

    console.log('Creating checkout session for:', { type, userId: user.id });

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const baseUrl = req.headers.get('origin') || 'https://monarchpropertymmgt.online';
    
    
    // Configure session based on type
    const sessionConfig: any = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: profile?.email || user.email,
      success_url: successUrl || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/dashboard`,
      metadata: {
        userId: user.id,
        type,
        ...metadata
      }
    };

    // Configure line items based on type
    switch (type) {
      case 'booking': {
        if (!bookingId) {
          throw new Error('Booking ID required for booking payments');
        }

        // Get booking details — amount comes from the booking record
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('property_id, check_in_date, check_out_date, guests, total_amount')
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .single();

        if (bookingError || !booking) {
          throw new Error('Booking not found or access denied');
        }

        amount = Number(booking.total_amount ?? 0);
        if (!(amount > 0)) {
          throw new Error('Booking has no payable amount');
        }

        sessionConfig.line_items = [{
          price_data: {
            currency,
            product_data: {
              name: 'Property Booking',
              description: `Booking for ${booking.guests} guests from ${booking.check_in_date} to ${booking.check_out_date}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        }];

        sessionConfig.metadata.bookingId = bookingId;
        break;
      }

      case 'vendor_payment': {
        if (!paymentId) {
          throw new Error('Payment ID required for vendor payments');
        }

        // Get payment details — amount comes from the payment record
        const { data: payment, error: paymentError } = await supabase
          .from('vendor_payments')
          .select('title, description, amount, status')
          .eq('id', paymentId)
          .eq('vendor_id', user.id)
          .single();

        if (paymentError || !payment) {
          throw new Error('Payment not found or access denied');
        }

        amount = Number(payment.amount ?? 0);
        if (!(amount > 0)) {
          throw new Error('Payment has no payable amount');
        }

        sessionConfig.line_items = [{
          price_data: {
            currency,
            product_data: {
              name: payment.title,
              description: payment.description || 'Vendor payment',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }];

        sessionConfig.metadata.paymentId = paymentId;
        break;
      }

      case 'subscription': {
        if (!subscriptionTier) {
          throw new Error('Subscription tier required for subscription payments');
        }

        // Fixed server-side price book (USD / month) — never client supplied
        const TIER_PRICES: Record<string, number> = {
          basic: 49,
          professional: 149,
          enterprise: 399,
        };

        amount = TIER_PRICES[subscriptionTier];
        if (!amount) {
          throw new Error('Unknown subscription tier');
        }

        sessionConfig.mode = 'subscription';
        // 7-day free trial — collect card up-front but do not charge until trial ends
        sessionConfig.payment_method_collection = 'always';
        sessionConfig.subscription_data = {
          trial_period_days: 7,
          trial_settings: {
            end_behavior: { missing_payment_method: 'cancel' },
          },
          metadata: { userId: user.id, subscriptionTier },
        };
        sessionConfig.line_items = [{
          price_data: {
            currency,
            product_data: {
              name: `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Subscription`,
              description: `Monthly ${subscriptionTier} subscription to Monarch Property Management — 7-day free trial`,
            },
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }];

        sessionConfig.metadata.subscriptionTier = subscriptionTier;
        break;
      }

      default:
        throw new Error('Invalid payment type');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Store transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        booking_id: bookingId || null,
        amount,
        currency,
        status: 'pending',
        stripe_session_id: session.id,
        ...(type === 'vendor_payment' && { application_id: paymentId })
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
    }

    console.log('Checkout session created successfully:', session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: unknown) {
    console.error('Error in create-checkout function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Unable to create checkout session',
        code: 'CHECKOUT_FAILED'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);