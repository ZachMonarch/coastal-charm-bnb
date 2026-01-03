-- Fix the security definer view warning by setting it to SECURITY INVOKER
-- This is the correct approach for a public-facing view
ALTER VIEW public_property_listings_masked SET (security_invoker = true);