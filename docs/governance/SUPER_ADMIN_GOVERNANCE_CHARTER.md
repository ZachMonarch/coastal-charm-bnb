# 🏛️ Monarch Super-Admin Governance Charter

## Overview

This charter establishes the operational framework for Monarch Property Management's Super-Admin Control Suite, ensuring full administrative capability with zero unlogged power, enforced policy friction, and complete audit traceability.

## 1. Scope of Authority

| Role | Scope | Permissions | Audit Obligation |
|------|-------|------------|------------------|
| **Super Admin** | Full system control (vendors, contracts, finance, projects, users) | May initiate any job in Control Suite | Must record intent + reason per job |
| **Ops Admin / Project Manager** | Projects + vendor relations | Limited to Ops-class jobs | Auto audit + notification |
| **Finance Admin** | Billing, invoices, payments | Finance-only RPCs | Auto audit + 2nd approval |
| **Audit Viewer** | Read-only oversight | Can view logs, no execution | None |

## 2. Governance Workflow

**Policy Lifecycle:** Draft → Review → Approve → Execute → Audit → Archive

Every `admin_jobs` entry must contain:
- `intent` (text): Clear reason for the operation
- `risk_level` (enum: low|medium|high)
- `approved_by` (UUID of co-sign admin)
- `rollback_token` (UUID auto-generated)

**High-risk jobs** (auto-detected: >100 rows or finance-related) require:
- Dual approval (creator ≠ approver)
- Confirmation notification
- Pre-execution snapshot

## 3. Operational Safeguards

### Database Constraints
```sql
-- Dual approval for high-risk operations
ALTER TABLE admin_jobs
ADD CONSTRAINT admin_job_dual_approval
CHECK (
  (risk_level <> 'high')
  OR (approved_by IS NOT NULL AND approved_by != created_by)
);
```

### Application Safeguards
- ✅ Environment color-coding (🟥 PRODUCTION / 🟨 STAGING / 🟩 DEV)
- ✅ Double confirmation for high-risk operations
- ✅ Typed confirmation: "EXECUTE_PROD"
- ✅ Checkbox: "I understand this affects N rows"
- ✅ User agent + IP logging per execution
- ✅ Production flag: `ALLOW_PROD_SUPER_ADMIN=1`

## 4. Use Guidelines

### ALWAYS
- Perform **dry-run first** (`status='dry_run'`)
- Read diff output (`dry_run_result`)
- Record intent in description
- Require co-signer if risk ≥ medium
- Validate affected rows ≤ expected

### NEVER
- Bypass RPC and directly `UPDATE/DELETE` critical tables
- Run execution jobs without audit snapshot
- Ignore post-job verification checks

## 5. Audit & Compliance Layer

**Tables:** 
- `admin_jobs` - Job definitions and status
- `admin_job_audit` - Immutable action log
- `admin_job_snapshots` - Pre-execution state backups

**Retention:** Permanent (immutable, append-only)

**Replication:** Daily export to Supabase Storage bucket `audit-backup/` + checksum hash

**Dashboard:** `/admin/control-suite` shows chronological timeline

**Digest:** Weekly email summary → Super Admins + Audit Viewers

## 6. Environment Fencing

```bash
SAFE_TEST_MODE=true
ALLOW_PROD_SUPER_ADMIN=0
VERCEL_ENV=staging|production
```

Production execution requires:
1. Manual flag override (`ALLOW_PROD_SUPER_ADMIN=1`)
2. Typed phrase `EXECUTE_PROD` in confirmation modal

## 7. Security Practices Checklist

- ✅ Quarterly key rotation (service + anon keys)
- ✅ Pre-commit grep for direct table updates
- ✅ RLS integration test pipeline
- ✅ Daily PITR snapshot job (`pg_dump`)
- ✅ Sentry alert on any update/delete > N rows
- ✅ Immutable audit snapshot off-site backup

## 8. Incident Response Procedure

If unexpected mass update occurs:

1. **Pause automation** (CI/CD hold)
2. **Query audit:** `SELECT * FROM admin_job_audit WHERE created_at > NOW() - INTERVAL '1 hour'`
3. **Restore snapshot:**
   ```sql
   INSERT INTO [table] 
   SELECT * FROM jsonb_to_recordset(
     (SELECT snapshot_data FROM admin_job_snapshots WHERE job_id='[JOB_UUID]')
   ) as t(*);
   ```
4. **Post-mortem:** Document in `docs/incident-reports/`
5. **Review gaps:** Amend charter

## 9. Governance Cadence

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Audit digest review | Weekly | Ops Admin |
| Key rotation | Quarterly | System Admin |
| Incident simulation | Quarterly | Security Lead |
| Policy review | Bi-annual | Super Admin Council |
| Backup restore test | Monthly | Infra Engineer |

## 10. Cultural Ethos

> "Power without proof is a liability.  
> Proof with purpose is sovereignty."

The Super-Admin Council operates as guardians of stability. Every action leaves a fingerprint, every decision a log. The goal is not to limit power but to channel it through ritualized discipline — the foundation of long-term resilience and trust.

---

**Last Updated:** October 26, 2025  
**Version:** 1.0  
**Status:** Active
