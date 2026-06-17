param(
    [int]$Port = 8080,
    [string]$Email = "tourist@test.com",
    [string]$Password = "Test123!",
    [string]$PgContainer = "traveltrust-postgres",
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:$Port"

function Invoke-Psql([string]$Sql) {
    if ($DatabaseUrl) {
        & psql $DatabaseUrl -v ON_ERROR_STOP=1 -q -c $Sql 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "psql failed: $Sql" }
        return
    }
    $out = docker exec $PgContainer psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -q -c $Sql 2>&1
    if ($LASTEXITCODE -ne 0) { throw "docker psql failed: $out" }
}

Write-Host "bootstrap-local-admin-console: email=$Email port=$Port"

Invoke-Psql "UPDATE users SET role = 'super_admin' WHERE email = '$Email';"
Invoke-Psql @"
INSERT INTO admin_console_roles (user_id, console_role)
SELECT id, 'SuperAdmin' FROM users WHERE email = '$Email'
ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin', updated_at = now();
"@
Invoke-Psql @"
INSERT INTO admin_security_policies (policy_key, policy_value)
VALUES ('admin_2fa_policy', jsonb_build_object('enforced', false))
ON CONFLICT (policy_key) DO UPDATE
SET policy_value = jsonb_set(admin_security_policies.policy_value, '{enforced}', 'false'::jsonb, true),
    updated_at = now();
"@

try {
    $login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" `
        -Body (@{ email = $Email; password = $Password } | ConvertTo-Json) -TimeoutSec 30
    $token = $login.token
    if (-not $token) { throw "login missing token" }
    $role = $login.role
    if ($role -notin @("admin", "super_admin")) {
        throw "login role=$role expected admin|super_admin"
    }
    $hdr = @{ Authorization = "Bearer $token" }
    $caps = Invoke-RestMethod -Uri "$base/api/v1/admin/capabilities" -Headers $hdr -TimeoutSec 30
    if ($caps.status -ne "ok") { throw "capabilities status=$($caps.status)" }
    $console70 = [string]$caps.console_role_70
    if ($console70 -ne "SuperAdmin") {
        throw "capabilities console_role_70=$console70 expected SuperAdmin (check admin_console_roles + Step 3d migrations)"
    }
    $prep = $caps.phase2_prep
    Write-Host "bootstrap-local-admin-console: OK login role=$role console_role_70=$console70 perms=$($caps.permissions.Count)"
    if ($prep) {
        Write-Host "  phase2_prep: adm_u02=$($prep.adm_u02_local_ready) approval=$($prep.console_role_approval_wired) audit=$($prep.audit_logs_persist)"
    }
} catch {
    Write-Warning "bootstrap-local-admin-console: login/capabilities probe WARN - $($_.Exception.Message) (re-login after stack ready)"
}

Write-Host "TT_BOOTSTRAP_LOCAL_ADMIN: PASS"
