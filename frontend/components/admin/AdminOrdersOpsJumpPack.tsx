"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  resolveOrdersOpsJumpPack,
  type OrdersOpsJumpPack,
} from "@/lib/admin/ordersOpsJumpPackL5";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";

type Props = {
  orderId?: string | null;
  state?: string | null;
  /** list banner vs detail desk */
  variant?: "detail" | "list";
};

/** Batch-11 HU-415 · Admin 只读作业跳转包（禁写 Escrow 状态机 / 资金） */
export function AdminOrdersOpsJumpPack({ orderId, state, variant = "list" }: Props) {
  const { t } = useTranslation();
  const pack: OrdersOpsJumpPack = resolveOrdersOpsJumpPack({ orderId, state });

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border border-ref-sun/40 bg-bg-console/50 px-4 py-3 ${ADMIN_FILTER_CARD_CLASS}`}
      role="note"
      data-tt-admin-orders-ops-jump-pack="1"
      data-tt-admin-orders-ops-variant={variant}
      data-tt-admin-orders-write-forbidden="1"
      data-tt-admin-orders-write-policy={pack.policy}
      data-tt-admin-orders-escrow-write="FORBIDDEN"
      data-tt-admin-orders-fund-write-forbidden="1"
      data-tt-admin-orders-data-origin-surface={pack.dataOriginSurface}
      data-tt-admin-orders-data-origin-deferred="1"
    >
      <p className="text-body font-medium text-ink-800">{t("admin_orders_ops_pack_title")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_orders_ops_pack_lead")}</p>
      <p
        className={`mt-2 ${ADMIN_TEXT_META_CLASS}`}
        data-tt-admin-orders-state-ops-explain="1"
        data-tt-admin-orders-state-family={pack.stateFamily}
      >
        {t(pack.stateExplainKey)}
      </p>
      <p
        className={`mt-2 ${ADMIN_TEXT_META_CLASS}`}
        data-tt-admin-orders-write-perm-note="1"
      >
        {t("admin_orders_ops_pack_write_note")}
      </p>
      <p
        className={`mt-2 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
        data-tt-admin-orders-data-origin-note="1"
      >
        {t("admin_orders_data_origin_deferred_note")}
      </p>
      <ol
        className="mt-3 list-decimal space-y-1 pl-5 text-small text-ink-700"
        data-tt-admin-orders-sop="1"
      >
        {pack.sopSteps.map((step) => (
          <li key={step.id} data-tt-admin-orders-sop-step={step.id}>
            {t(step.labelKey)}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-3" data-tt-admin-orders-ops-ctas="1">
        {pack.adminDetailHref && variant === "list" ? (
          <Link
            href={pack.adminDetailHref}
            className={adminTableRowSecondaryActionClass()}
            data-tt-admin-orders-ops-cta="admin-detail"
          >
            {t("admin_ops_orderDetailAdmin")}
          </Link>
        ) : null}
        {pack.escrowHref ? (
          <Link
            href={pack.escrowHref}
            className={adminTableRowPrimaryActionClass()}
            data-tt-admin-orders-ops-cta="escrow"
          >
            {t("admin_ops_orderEscrow")}
          </Link>
        ) : (
          <Link
            href="/admin/orders"
            className={adminTableRowSecondaryActionClass()}
            data-tt-admin-orders-ops-cta="orders-list"
          >
            {t("admin_orders_title")}
          </Link>
        )}
        {pack.payHref ? (
          <Link
            href={pack.payHref}
            className={adminTableRowSecondaryActionClass()}
            data-tt-admin-orders-ops-cta="pay"
          >
            {t("admin_ops_payHub")}
          </Link>
        ) : null}
        <Link
          href={pack.disputesHref}
          className={adminTableRowSecondaryActionClass()}
          data-tt-admin-orders-ops-cta="disputes"
        >
          {t("admin_disputes_title")}
        </Link>
      </div>
    </aside>
  );
}
