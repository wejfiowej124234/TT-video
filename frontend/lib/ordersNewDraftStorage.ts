/** `/orders/new` 登录中断前暂存金额/币种（① · sessionStorage） */

const STORAGE_KEY = "tt_orders_new_draft_v1";

export type OrdersNewDraft = {
  guide_id: string;
  amount?: string;
  currency?: string;
  start_date?: string;
  end_date?: string;
};

export function stashOrdersNewDraft(draft: OrdersNewDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function readOrdersNewDraft(guideId: string): OrdersNewDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrdersNewDraft;
    if (parsed?.guide_id?.trim() !== guideId.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOrdersNewDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
