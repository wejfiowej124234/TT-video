/**
 * `POST /api/v1/orders` 在种子向导已有 Accepted/Escrowed 占位时返回 409 `guide_has_active_order`
 *（内存 `guide_slot`；DB hydrate 会重建）。E2E 需先释放档期：
 * - **accepted**（及可取消的 draft/created 等）→ `POST …/cancel`
 * - **escrowed**（不可直取消）→ `POST …/confirm-completion`（与 Epic F mock 路径一致，终态 completed 释放 slot）
 */
import type { APIRequestContext } from "@playwright/test";

function idemKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function releaseSeedGuideSlotIfBlocked(
  request: APIRequestContext,
  apiBase: string,
): Promise<void> {
  const login = await request.post(`${apiBase}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: "guide@test.com", password: "Test123!" },
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

    if (
      ["draft", "open", "created", "accepted"].includes(st)
    ) {
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
