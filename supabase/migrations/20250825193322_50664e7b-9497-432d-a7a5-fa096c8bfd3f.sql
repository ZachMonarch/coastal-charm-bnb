-- Enable leaked password protection for enhanced security
-- This protects against known compromised passwords from data breaches
UPDATE auth.config 
SET enable_leaked_password_protection = true 
WHERE TRUE;