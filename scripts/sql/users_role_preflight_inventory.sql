-- B-311 / TT-B311-87-USERS-ROLE-PREFLIGHT-INVENTORY-001
-- Read-only inventory of public.users.role BEFORE any DDL that tightens CHECK / DEFAULT.
-- Allowlist MUST stay aligned with crates/api/src/routes/admin/mod.rs::is_supported_target_role
-- (tourist | traveler | guide | arbitrator | admin | super_admin | provider | region_steward).

-- 1) Histogram: exact stored value (case / whitespace preserved)
SELECT role AS role_raw, COUNT(*)::bigint AS user_count
FROM users
GROUP BY role
ORDER BY user_count DESC, role_raw ASC;

-- 2) Rows whose normalized role is outside the application allowlist
SELECT role AS role_raw, COUNT(*)::bigint AS user_count
FROM users
WHERE lower(trim(both from role)) NOT IN (
    'tourist',
    'traveler',
    'guide',
    'arbitrator',
    'admin',
    'super_admin',
    'provider',
    'region_steward'
)
GROUP BY role
ORDER BY user_count DESC, role_raw ASC;

-- 3) Leading / trailing whitespace (often invisible in UI / logs)
SELECT role AS role_raw, COUNT(*)::bigint AS user_count
FROM users
WHERE role IS DISTINCT FROM trim(both from role)
GROUP BY role
ORDER BY user_count DESC, role_raw ASC;

-- 4) Headline total
SELECT count(*)::bigint AS users_total FROM users;
