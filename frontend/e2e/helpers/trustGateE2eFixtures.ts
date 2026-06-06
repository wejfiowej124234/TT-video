import type { APIRequestContext } from "@playwright/test";
import { seedTestAccounts } from "./apiSession";
import { requestPostWith429Retry } from "./playwright429Backoff";
import { skipIfApiDown } from "./skipIfApiDown";

export type TrustGateSeedBody = {
  status: string;
  password?: string;
  users?: Record<string, { id: string; email: string }>;
  guide_rows?: Record<string, string>;
  orders?: Record<string, string>;
  disputes?: Record<string, string>;
};

/** `SEED_TEST_ACCOUNTS=1` 时调用；先 `seed-test-accounts` 再注入 trust-gate 夹具。 */
export async function seedTrustGateE2eFixtures(
  request: APIRequestContext,
  apiBase: string,
): Promise<TrustGateSeedBody> {
  await skipIfApiDown(request);
  await seedTestAccounts(request, apiBase);
  const res = await requestPostWith429Retry(request, `${apiBase}/auth/seed-trust-gate-e2e`, {
    headers: { "Content-Type": "application/json" },
    data: "{}",
  });
  if (!res.ok()) {
    const t = await res.text();
    throw new Error(`seed-trust-gate-e2e failed ${res.status()}: ${t.slice(0, 500)}`);
  }
  return (await res.json()) as TrustGateSeedBody;
}
