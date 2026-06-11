/** 刷新后回填 Landing 预览卡；404 / 已取消的 id 从 localStorage 剔除。 */

export function landingOrderHydrateShouldDrop(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg === "order_not_found" || msg === "invalid_uuid";
}

export function landingOrderResponseShouldDrop(order: unknown): boolean {
  if (!order || typeof order !== "object") return false;
  const row = order as {
    order?: { status?: string; state?: string };
    status?: string;
    state?: string;
  };
  const st = String(row.order?.status ?? row.order?.state ?? row.status ?? row.state ?? "")
    .trim()
    .toLowerCase();
  return st === "cancelled" || st === "canceled";
}

export async function hydrateLandingUnlockedOrderDetails(
  orderIds: readonly string[],
  fetchOrder: (id: string) => Promise<unknown>,
): Promise<{ details: Record<string, unknown>; staleIds: string[] }> {
  const details: Record<string, unknown> = {};
  const staleIds: string[] = [];
  for (const orderId of orderIds) {
    try {
      const detail = await fetchOrder(orderId);
      if (landingOrderResponseShouldDrop(detail)) {
        staleIds.push(orderId);
      } else {
        details[orderId] = detail;
      }
    } catch (err) {
      if (landingOrderHydrateShouldDrop(err)) staleIds.push(orderId);
    }
  }
  return { details, staleIds };
}

export function pruneLandingSessionOrderIds(
  resultIds: readonly string[],
  unlockedIds: ReadonlySet<string>,
  favoriteIds: ReadonlySet<string>,
  staleIds: readonly string[],
): {
  resultOrderIds: string[];
  unlockedOrderIds: Set<string>;
  favoritedIds: Set<string>;
} {
  if (staleIds.length === 0) {
    return {
      resultOrderIds: [...resultIds],
      unlockedOrderIds: new Set(unlockedIds),
      favoritedIds: new Set(favoriteIds),
    };
  }
  const stale = new Set(staleIds);
  return {
    resultOrderIds: resultIds.filter((id) => !stale.has(id)),
    unlockedOrderIds: new Set([...unlockedIds].filter((id) => !stale.has(id))),
    favoritedIds: new Set([...favoriteIds].filter((id) => !stale.has(id))),
  };
}
