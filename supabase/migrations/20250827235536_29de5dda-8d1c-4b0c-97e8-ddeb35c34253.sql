-- Enable leaked password protection
-- This must be done through Supabase Dashboard Auth settings

-- Add missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_requests_assigned_vendor_id ON maintenance_requests(assigned_vendor_id);

-- Add rate limiting function for production
CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
    p_identifier text, 
    p_endpoint text, 
    p_max_requests integer DEFAULT 100, 
    p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMPTZ;
    cleanup_threshold TIMESTAMPTZ;
BEGIN
    -- Calculate window start time (round down to window boundary)
    window_start_time := date_trunc('hour', now()) + 
        (EXTRACT(minute FROM now())::integer / p_window_minutes) * (p_window_minutes || ' minutes')::interval;
    
    -- Set cleanup threshold (remove entries older than 24 hours)
    cleanup_threshold := now() - interval '24 hours';
    
    -- Clean up old entries in background (non-blocking)
    PERFORM pg_notify('cleanup_rate_limits', cleanup_threshold::text);
    
    -- Use UPSERT for atomic operation
    INSERT INTO public.rate_limits (identifier, endpoint, requests_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, window_start_time)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET 
        requests_count = rate_limits.requests_count + 1,
        created_at = now()
    RETURNING requests_count INTO current_count;
    
    -- Return whether limit is exceeded
    RETURN current_count <= p_max_requests;
END;
$$;

-- Create application logs table for better monitoring
CREATE TABLE IF NOT EXISTS public.application_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level text NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
    message text NOT NULL,
    context jsonb DEFAULT '{}',
    user_id uuid,
    session_id text,
    ip_address inet,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on application logs
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for application logs (admin only)
CREATE POLICY "Admin only access to application logs"
ON public.application_logs
FOR ALL
USING (is_admin_user(auth.uid()));

-- Add trigger for automatic cleanup
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete logs older than 30 days
    DELETE FROM public.application_logs 
    WHERE created_at < now() - interval '30 days';
    
    -- Delete old rate limit entries
    DELETE FROM public.rate_limits 
    WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Create notification queue table for email/SMS
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    recipient text NOT NULL,
    subject text,
    message text NOT NULL,
    template_name text,
    template_data jsonb DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    scheduled_at timestamptz DEFAULT now(),
    sent_at timestamptz,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on notification queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for notification queue (service role only)
CREATE POLICY "Service role manages notifications"
ON public.notification_queue
FOR ALL
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON public.notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();