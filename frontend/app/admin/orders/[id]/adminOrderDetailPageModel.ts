import { formatAdminMoney } from "@/lib/admin/formatAdminMoney";
import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";
import { ADMIN_OPS_OBSERVABILITY_RELATED_LINK } from "@/lib/admin/adminOpsListRelatedFoldLinks";

export type AdminOrderDetailRes = {
  status?: string;
  error?: string;
  order?: Record<string, unknown>;
  itinerary?: unknown;
  meta?: unknown;
};

export function formatAdminOrderDetailField(key: string, v: unknown): string {
  if (v === null || v === undefined) return "";
  if (key === "amount") {
    const formatted = formatAdminMoney(v as string | number);
    return formatted || (typeof v === "string" ? v : String(v));
  }
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const ADMIN_ORDER_DETAIL_FIELDS = [
  { key: "id", labelKey: "admin_orders_colOrderId" },
  { key: "state", labelKey: "admin_orders_colState" },
  { key: "amount", labelKey: "admin_orders_colAmount" },
  { key: "currency", labelKey: "admin_order_detail_currency" },
  { key: "tourist_id", labelKey: "admin_orders_colTourist" },
  { key: "guide_id", labelKey: "admin_orders_colGuide" },
  { key: "escrow_address", labelKey: "admin_orders_colEscrow" },
  { key: "destination", labelKey: "admin_order_detail_destination" },
  { key: "city", labelKey: "admin_order_detail_city" },
  { key: "travel_date", labelKey: "admin_order_detail_travelDate" },
  { key: "created_at", labelKey: "admin_orders_colCreated" },
  { key: "accepted_at", labelKey: "admin_order_detail_acceptedAt" },
  { key: "escrowed_at", labelKey: "admin_order_detail_escrowedAt" },
  { key: "completed_at", labelKey: "admin_order_detail_completedAt" },
  { key: "sub_status", labelKey: "admin_order_detail_subStatus" },
] as const;

/** 订单详情 · 折叠交叉入口。 */
export const ORDER_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/orders", labelKey: "admin_order_detail_back_list", dataTt: "admin-order-detail-back-list" },
  { href: "/admin/disputes", labelKey: "admin_disputes_title" },
  { href: "/admin/reviews", labelKey: "admin_reviews_title" },
  { href: "/admin/users", labelKey: "admin_users_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];
