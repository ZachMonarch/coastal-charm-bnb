# Cron Jobs Setup for Monarch Property Management

This document contains the SQL to schedule automated background tasks using Supabase's `pg_cron` extension.

## Prerequisites

Before running these SQL commands, ensure that:
1. The `pg_cron` extension is enabled in your Supabase project
2. The `pg_net` extension is enabled for HTTP requests

You can enable these in the Supabase Dashboard under **Database → Extensions**.

## Cron Job SQL Commands

Run these commands in the Supabase SQL Editor (Dashboard → SQL Editor):

### 1. RFQ Deadline Reminders (Daily at 9:00 AM UTC)

Sends email reminders to vendors who haven't submitted bids for RFQs with deadlines approaching.

```sql
SELECT cron.schedule(
  'send-rfq-reminders-daily',
  '0 9 * * *', -- Every day at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://yhegaaqxmuhszesbjtdo.supabase.co/functions/v1/send-rfq-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE'
      ),
      body := jsonb_build_object('triggered_at', now()::text)
    ) AS request_id;
  $$
);
```

### 2. Compliance Document Expiry Checks (Weekly on Monday at 8:00 AM UTC)

Checks for vendor documents expiring within 30 days and sends notifications.

```sql
SELECT cron.schedule(
  'check-compliance-expiry-weekly',
  '0 8 * * 1', -- Every Monday at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://yhegaaqxmuhszesbjtdo.supabase.co/functions/v1/check-compliance-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE'
      ),
      body := jsonb_build_object('triggered_at', now()::text)
    ) AS request_id;
  $$
);
```

### 3. Newsletter Digest (Weekly on Friday at 10:00 AM UTC)

Sends weekly newsletter digest to subscribed users.

```sql
SELECT cron.schedule(
  'send-newsletter-weekly',
  '0 10 * * 5', -- Every Friday at 10:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://yhegaaqxmuhszesbjtdo.supabase.co/functions/v1/send-newsletter',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE'
      ),
      body := jsonb_build_object('triggered_at', now()::text)
    ) AS request_id;
  $$
);
```

### 4. Daily Analytics Cleanup (Daily at 3:00 AM UTC)

Cleans up old analytics data and rate limit records.

```sql
SELECT cron.schedule(
  'cleanup-old-data-daily',
  '0 3 * * *', -- Every day at 3:00 AM UTC
  $$
  -- Clean up old rate limit records (older than 24 hours)
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
  
  -- Clean up old news analytics (older than 90 days)
  DELETE FROM news_analytics WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);
```

## Managing Cron Jobs

### View All Scheduled Jobs

```sql
SELECT jobid, schedule, command, nodename, active
FROM cron.job
ORDER BY jobid;
```

### Disable a Job

```sql
SELECT cron.unschedule('job-name-here');
```

### View Job History

```sql
SELECT jobid, runid, job_pid, database, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

## Security Considerations

1. **API Keys**: The cron jobs use the Supabase anon key which is safe for these operations. For sensitive operations, consider using a service role key stored as a database secret.

2. **Rate Limiting**: The edge functions called by these cron jobs should implement their own rate limiting and idempotency checks.

3. **Monitoring**: Check `cron.job_run_details` regularly to ensure jobs are running successfully.

## Troubleshooting

If cron jobs are not running:

1. Verify extensions are enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
   ```

2. Check job status:
   ```sql
   SELECT * FROM cron.job WHERE active = true;
   ```

3. Review recent run history for errors:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE status != 'succeeded' 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```
