/**
 * 市场子站 **POST …/listings** 走 **`ensure_market_write_onboarding_entitlement`**（`provider` / `region_steward`）。
 * 纯新注册用户无 `onboarding_entitlements` 时发布会 400，本地 E2E 在注册后向 PG 插入一条 **paid** 行以完成 ① 闭环。
 *
 * 执行顺序：优先 **`docker exec … psql`**（与根 **`docker-compose.yml`** 默认容器名一致），失败再 **`psql "$DATABASE_URL"`**。
 */
import { execFileSync } from "node:child_process";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MarketEntitlementRole = "provider" | "region_steward";

export function seedPaidMarketEntitlements(userId: string, roles: MarketEntitlementRole[]): void {
  if (!UUID_RE.test(userId)) {
    throw new Error(`seedPaidMarketEntitlements: invalid user id ${userId}`);
  }
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    throw new Error("seedPaidMarketEntitlements: DATABASE_URL is not set");
  }

  for (const role of roles) {
    const sql =
      `INSERT INTO onboarding_entitlements (user_id, role_target, sku, fee_schedule_version, status, metadata, paid_at) ` +
      `VALUES ('${userId}'::uuid, '${role}', 'e2e_local_gate', '1', 'paid', '{}'::jsonb, now());`;

    const container = process.env.E2E_PG_DOCKER_CONTAINER ?? "traveltrust-postgres";

    try {
      execFileSync(
        "docker",
        [
          "exec",
          "-i",
          container,
          "psql",
          "-U",
          "traveltrust",
          "-d",
          "traveltrust",
          "-v",
          "ON_ERROR_STOP=1",
          "-c",
          sql,
        ],
        { stdio: "pipe", encoding: "utf8" },
      );
    } catch (firstErr) {
      try {
        execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
          stdio: "pipe",
          encoding: "utf8",
          env: process.env,
        });
      } catch {
        const hint =
          "Insert onboarding_entitlements failed. Ensure Docker postgres is up (`docker compose up -d`) " +
          "or `psql` is on PATH, and DATABASE_URL matches that instance.";
        throw new Error(`${hint}\n/docker: ${String(firstErr)}`);
      }
    }
  }
}
