import type { APIRequestContext } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  seedTestAccounts,
  type BearerSessionCredentials,
} from "./apiSession";

export type StagingUatSessions = {
  tourist: BearerSessionCredentials;
  admin: BearerSessionCredentials;
};

export function stagingUatEmail(): string {
  return process.env.STAGING_UAT_EMAIL?.trim() || "tourist@test.com";
}

export function stagingUatPassword(): string {
  return process.env.STAGING_UAT_PASSWORD?.trim() || "Test123!";
}

/** ② staging UAT：seed → promote admin → 双会话（tourist 与 admin 默认同邮箱）。 */
export async function stagingUatSeedAndLogin(
  request: APIRequestContext,
  apiBase = defaultApiBase(),
): Promise<StagingUatSessions | null> {
  const email = stagingUatEmail();
  const password = stagingUatPassword();

  await seedTestAccounts(request, apiBase);
  await request
    .post(`${apiBase}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: { promote_admin_email: email },
    })
    .catch(() => null);

  const creds = await apiLoginReturnCredentials(request, apiBase, email, password);
  if (!creds?.token) return null;
  return { tourist: creds, admin: creds };
}
