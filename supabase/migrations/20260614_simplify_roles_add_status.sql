-- ============================================================
-- Phase 1: Simplify roles to 3 + add member status / last_seen
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Review section 1 (SELECT) BEFORE running section 2 (writes).
--
-- Role remap:
--   account_lead -> team_member
--   finance      -> team_member
--   viewer       -> team_member
--   admin        -> admin (unchanged)
--
-- New columns on workspace_members:
--   status     TEXT NOT NULL DEFAULT 'active'   ('active' | 'suspended')
--   last_seen  TIMESTAMPTZ NULL                 (used for online indicator)
--
-- New RPC: public.touch_last_seen()
--   Updates the caller's own row. SECURITY DEFINER so users don't need
--   broad UPDATE rights on workspace_members.
-- ============================================================


-- ============================================================
-- 1. PREVIEW (read-only)
-- ============================================================
-- Run these two SELECTs first. They show every member and invitation
-- that will be remapped, with the user's name and email so you can
-- sanity-check the list before the writes in section 2.

SELECT
  wm.id,
  wm.workspace_id,
  wm.user_id,
  wm.role        AS old_role,
  'team_member'  AS new_role,
  p.full_name,
  au.email
FROM workspace_members wm
LEFT JOIN profiles p     ON p.id  = wm.user_id
LEFT JOIN auth.users au  ON au.id = wm.user_id
WHERE wm.role IN ('account_lead', 'finance', 'viewer')
ORDER BY wm.workspace_id, wm.role;

SELECT
  id,
  workspace_id,
  email,
  role           AS old_role,
  'team_member'  AS new_role,
  expires_at
FROM invitations
WHERE role IN ('account_lead', 'finance', 'viewer')
  AND accepted_at IS NULL
ORDER BY workspace_id;


-- ============================================================
-- 2. APPLY (writes). Run only after reviewing section 1.
-- ============================================================

BEGIN;

-- Drop old CHECK constraints so the UPDATE below can run.
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;
ALTER TABLE invitations       DROP CONSTRAINT IF EXISTS invitations_role_check;

-- Remap legacy roles.
UPDATE workspace_members
SET role = 'team_member'
WHERE role IN ('account_lead', 'finance', 'viewer');

UPDATE invitations
SET role = 'team_member'
WHERE role IN ('account_lead', 'finance', 'viewer');

-- Re-add CHECK constraints with the new role set.
ALTER TABLE workspace_members
  ADD CONSTRAINT workspace_members_role_check
  CHECK (role IN ('admin', 'team_member', 'sales'));

ALTER TABLE invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('admin', 'team_member', 'sales'));

-- Add status column (suspended users are blocked at /dashboard/layout.tsx).
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));

-- Add last_seen for the green-dot online indicator on the team page.
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Backfill last_seen so existing rows appear recently active once.
UPDATE workspace_members
SET last_seen = COALESCE(last_seen, created_at)
WHERE last_seen IS NULL;

-- Index supports the "online in last 5 minutes" lookup on the team page.
CREATE INDEX IF NOT EXISTS idx_workspace_members_last_seen
  ON workspace_members (last_seen);

-- RPC: lets the signed-in user touch their own last_seen without needing
-- broad UPDATE permission on workspace_members. Called from the dashboard
-- layout on every authenticated page load (Phase 3).
CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE workspace_members
  SET last_seen = NOW()
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

COMMIT;


-- ============================================================
-- 3. VERIFY
-- ============================================================
-- Confirms the role/status distribution after the migration.
-- Expect: only admin / team_member / sales, status only active / suspended.

SELECT role, status, COUNT(*) AS member_count
FROM workspace_members
GROUP BY role, status
ORDER BY role, status;

SELECT role, COUNT(*) AS invitation_count
FROM invitations
WHERE accepted_at IS NULL
GROUP BY role
ORDER BY role;
