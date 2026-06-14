/**
 * ① 公众 catalog · 杭州 trust-gate 向导（GD-L5 / P03–P06 主链 SSOT）
 * 与 `scripts/dev/smoke-guide-detail-booking-p2-local.sh` 同源。
 */
import type { APIRequestContext } from "@playwright/test";

export const PUBLIC_CATALOG_HANGZHOU_GUIDE_ID =
  "f0e0b101-0001-4001-8001-000000000001";

export const PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL =
  "tg_guide_main@trustgate-e2e.local";

export const TRUST_GATE_E2E_PASSWORD = "Test123!";

function idemKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 释放杭州公众 catalog 向导档期（`tg_guide_main` 侧订单 cancel / confirm-completion） */
export async function releasePublicCatalogHangzhouGuideSlotIfBlocked(
  request: APIRequestContext,
  apiBase: string,
): Promise<void> {
  const login = await request.post(`${apiBase}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: {
      email: PUBLIC_CATALOG_HANGZHOU_GUIDE_EMAIL,
      password: TRUST_GATE_E2E_PASSWORD,
    },
  });
  if (!login.ok()) return;
  const { token } = (await login.json()) as { token?: string };
  const guideTok = token?.trim();
  if (!guideTok) return;

  const list = await request.get(`${apiBase}/api/v1/orders`, {
    headers: { Authorization: `Bearer ${guideTok}` },
  });
  if (!list.ok()) return;
  const body = (await list.json()) as {
    items?: { id?: string; state?: string; status?: string }[];
  };

  for (const row of body.items ?? []) {
    const id = row.id?.trim();
    if (!id) continue;
    const st = (row.state ?? row.status ?? "").toLowerCase();

    if (st === "escrowed") {
      await request
        .post(`${apiBase}/api/v1/orders/${encodeURIComponent(id)}/confirm-completion`, {
          headers: {
            Authorization: `Bearer ${guideTok}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idemKey(),
          },
          data: "{}",
        })
        .catch(() => null);
      continue;
    }

    if (["draft", "open", "created", "accepted"].includes(st)) {
      await request
        .post(`${apiBase}/api/v1/orders/${encodeURIComponent(id)}/cancel`, {
          headers: {
            Authorization: `Bearer ${guideTok}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idemKey(),
          },
          data: "{}",
        })
        .catch(() => null);
    }
  }
}
