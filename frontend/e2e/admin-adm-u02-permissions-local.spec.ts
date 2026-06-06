/**
 * ADM-U02 · ① 本地 API：控制台角色审批链 + 2FA 策略（须 API :8080 + DATABASE_URL migrate）
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase, seedTestAccounts } from "./helpers/apiSession";

const apiBase = defaultApiBase();
const password = "Test123!";
const stamp = Date.now();

function writeHeaders(token: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${token}`,
    "Idempotency-Key": `adm-u02-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...extra,
  };
}

async function registerAdmin(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  usersRole: "super_admin" | "admin",
) {
  const reg = await request.post(`${apiBase}/auth/register`, {
    data: { email, password, nickname: email },
  });
  expect(reg.ok()).toBeTruthy();
  const body0 = (await reg.json()) as { token?: string; user_id?: string };
  const userId = body0.user_id?.trim() ?? "";
  expect(userId.length).toBeGreaterThan(0);

  const seed = await request.post(`${apiBase}/auth/seed-test-accounts`, {
    data: { promote_admin_email: email },
  });
  expect(seed.ok()).toBeTruthy();

  const dbUrl = process.env.DATABASE_URL ?? process.env.STAGING_DATABASE_URL ?? "";
  if (!dbUrl) {
    test.skip(true, "DATABASE_URL required for role promotion");
  }
  const { execSync } = await import("node:child_process");
  const psql =
    process.platform === "win32" && !process.env.PSQL_PATH
      ? `docker exec traveltrust-postgres psql -U traveltrust -d traveltrust`
      : `psql "${dbUrl}"`;
  execSync(
    `${psql} -v ON_ERROR_STOP=1 -q -c "UPDATE users SET role = '${usersRole}' WHERE id = '${userId}'::uuid;"`,
    { stdio: "ignore", shell: true },
  );
  if (usersRole === "super_admin") {
    execSync(
      `${psql} -v ON_ERROR_STOP=1 -q -c "INSERT INTO admin_console_roles (user_id, console_role) VALUES ('${userId}'::uuid, 'SuperAdmin') ON CONFLICT (user_id) DO UPDATE SET console_role = 'SuperAdmin';"`,
      { stdio: "ignore", shell: true },
    );
  }

  const login = await request.post(`${apiBase}/auth/login`, {
    data: { email, password },
  });
  expect(login.ok()).toBeTruthy();
  const body = (await login.json()) as { token?: string; user_id?: string };
  const token = body.token?.trim() ?? "";
  expect(token.length).toBeGreaterThan(0);
  return { token, userId };
}

function reset2faPolicyEnforced() {
  const dbUrl = process.env.DATABASE_URL ?? process.env.STAGING_DATABASE_URL ?? "";
  if (!dbUrl) return;
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const psql =
    process.platform === "win32" && !process.env.PSQL_PATH
      ? `docker exec traveltrust-postgres psql -U traveltrust -d traveltrust`
      : `psql "${dbUrl}"`;
  execSync(
    `${psql} -v ON_ERROR_STOP=1 -q -c "UPDATE admin_security_policies SET policy_value = jsonb_set(policy_value, '{enforced}', 'false'::jsonb, true) WHERE policy_key = 'admin_2fa_policy';"`,
    { stdio: "ignore", shell: true },
  );
}

test.describe("ADM-U02 local API @adm-u02", () => {
  test("console role approval + 2fa policy", async ({ request }) => {
    reset2faPolicyEnforced();
    await seedTestAccounts(request, apiBase);

    const req = await registerAdmin(
      request,
      `adm-u02-e2e-req-${stamp}@traveltrust.test`,
      "super_admin",
    );
    const app = await registerAdmin(
      request,
      `adm-u02-e2e-app-${stamp}@traveltrust.test`,
      "super_admin",
    );
    const tgt = await registerAdmin(
      request,
      `adm-u02-e2e-tgt-${stamp}@traveltrust.test`,
      "admin",
    );

    const caps = await request.get(`${apiBase}/api/v1/admin/capabilities`, {
      headers: { Authorization: `Bearer ${req.token}` },
    });
    expect(caps.ok()).toBeTruthy();
    const capsJson = (await caps.json()) as {
      phase2_prep?: {
        adm_u02_local_ready?: boolean;
        console_role_approval_wired?: boolean;
        audit_logs_persist?: boolean;
      };
    };
    expect(capsJson.phase2_prep?.adm_u02_local_ready).toBe(true);
    expect(capsJson.phase2_prep?.console_role_approval_wired).toBe(true);
    expect(capsJson.phase2_prep?.audit_logs_persist).toBe(true);

    const direct = await request.put(
      `${apiBase}/api/v1/admin/users/${tgt.userId}/console-role`,
      {
        headers: writeHeaders(req.token),
        data: { console_role_70: "Risk", reason: "e2e-direct" },
      },
    );
    expect(direct.status()).toBe(409);

    const pending = await request.post(
      `${apiBase}/api/v1/admin/users/${tgt.userId}/console-role-change-request`,
      {
        headers: writeHeaders(req.token),
        data: { console_role_70: "Risk", reason: "e2e-adm-u02" },
      },
    );
    expect(pending.ok()).toBeTruthy();
    const pendingJson = (await pending.json()) as { approval_request_id?: string };
    const approvalId = pendingJson.approval_request_id?.trim() ?? "";
    expect(approvalId.length).toBeGreaterThan(0);

    const approved = await request.post(
      `${apiBase}/api/v1/admin/approvals/${approvalId}/approve`,
      {
        headers: writeHeaders(app.token),
        data: { reason: "e2e-approve" },
      },
    );
    expect(approved.ok()).toBeTruthy();

    const policyOn = await request.patch(`${apiBase}/api/v1/admin/security/2fa-policy`, {
      headers: writeHeaders(req.token),
      data: { enforced: true },
    });
    expect(policyOn.ok()).toBeTruthy();

    const blocked = await request.post(
      `${apiBase}/api/v1/admin/users/${tgt.userId}/console-role-change-request`,
      {
        headers: writeHeaders(req.token),
        data: { console_role_70: "Finance", reason: "e2e-no-2fa" },
      },
    );
    expect(blocked.status()).toBe(403);

    reset2faPolicyEnforced();
    const policyOff = await request.patch(`${apiBase}/api/v1/admin/security/2fa-policy`, {
      headers: writeHeaders(req.token),
      data: { enforced: false },
    });
    expect(policyOff.ok()).toBeTruthy();
  });
});
