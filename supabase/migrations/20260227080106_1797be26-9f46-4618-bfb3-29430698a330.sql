-- Action 2.1: Assign default tenant_id to 12 orphaned users
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Action 2.2: Resolve 7 stale pending approval requests
UPDATE user_approval_requests
SET status = 'approved',
    reviewed_at = NOW(),
    admin_notes = 'Auto-resolved: User already has the requested role'
WHERE status = 'pending'
AND EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = user_approval_requests.user_id
  AND ur.role = user_approval_requests.role_requested
);