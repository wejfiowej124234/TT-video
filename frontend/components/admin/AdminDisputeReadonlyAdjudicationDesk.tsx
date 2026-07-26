"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  resolveDisputeAdjudicationDesk,
  type DisputeAdjudicationDesk,
} from "@/lib/admin/disputeOpsL5";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type Props = {
  disputeId: string | null | undefined;
  orderId: string | null | undefined;
  status?: string | null;
  /** list banner vs detail desk */
  variant?: "detail" | "list";
  /** Batch-13 FD10 · list 默认折叠为 1 行摘要 */
  defaultCollapsed?: boolean;
};

/** Batch-11 HU-414 · Admin 只读裁决台 / 公开页仲裁 SOP（禁写资金与 Escrow 状态机） */
export function AdminDisputeReadonlyAdjudicationDesk({
  disputeId,
  orderId,
  status,
  variant = "detail",
  defaultCollapsed = false,
}: Props) {
  const { t } = useTranslation();
  const desk: DisputeAdjudicationDesk = resolveDisputeAdjudicationDesk({
    disputeId,
    orderId,
    status,
  });

  const body = (
    <>
      {defaultCollapsed ? null : (
        <p className="text-body font-medium text-ink-800">{t("admin_dispute_adjudication_title")}</p>
      )}
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_dispute_adjudication_lead")}</p>
      <p
        className={`mt-2 ${ADMIN_TEXT_META_CLASS}`}
        data-tt-admin-dispute-write-perm-note="1"
      >
        {t("admin_dispute_adjudication_perm_note")}
      </p>
      <ol
        className="mt-3 list-decimal space-y-1 pl-5 text-small text-ink-700"
        data-tt-admin-dispute-sop="1"
      >
        {desk.sopSteps.map((step) => (
          <li key={step.id} data-tt-admin-dispute-sop-step={step.id}>
            {t(step.labelKey)}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-3">
        {desk.publicHref ? (
          <Link
            href={desk.publicHref}
            className={adminTableRowPrimaryActionClass()}
            data-tt-admin-dispute-public-arb-cta="1"
          >
            {t("admin_dispute_adjudication_open_public")}
          </Link>
        ) : null}
        {desk.orderAdminHref ? (
          <Link
            href={desk.orderAdminHref}
            className={adminTableRowSecondaryActionClass()}
            data-tt-admin-dispute-order-admin-cta="1"
          >
            {t("admin_dispute_detail_linkOrderAdmin")}
          </Link>
        ) : null}
        {desk.escrowHref ? (
          <Link
            href={desk.escrowHref}
            className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-dispute-escrow-readonly-cta="1"
          >
            {t("admin_dispute_adjudication_open_escrow_readonly")}
          </Link>
        ) : null}
      </div>
      <p className={`mt-2 ${ADMIN_TEXT_FOOTNOTE_CLASS}`} data-tt-admin-dispute-fund-write-forbidden="1">
        {t("admin_dispute_adjudication_fund_forbidden")}
      </p>
    </>
  );

  if (defaultCollapsed && variant === "list") {
    return (
      <details
        className={`mb-4 rounded-[var(--radius-md)] border border-ref-sun/40 bg-bg-console/50 px-4 py-3 ${ADMIN_FILTER_CARD_CLASS}`}
        role="note"
        data-tt-admin-dispute-adjudication-desk="1"
        data-tt-admin-dispute-adjudication-variant={variant}
        data-tt-admin-dispute-adjudication-collapsed="1"
        data-tt-admin-dispute-write-forbidden="1"
        data-tt-admin-dispute-resolution-policy={desk.policy}
        data-tt-admin-dispute-escrow-write="FORBIDDEN"
      >
        <summary className="cursor-pointer text-body font-medium text-ink-800">
          {t("admin_dispute_adjudication_title")}
          <span className={`ml-2 font-normal ${ADMIN_TEXT_META_CLASS}`}>
            {t("admin_dispute_adjudication_list_summary")}
          </span>
        </summary>
        <div className="mt-2">{body}</div>
      </details>
    );
  }

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border border-ref-sun/40 bg-bg-console/50 px-4 py-3 ${ADMIN_FILTER_CARD_CLASS}`}
      role="note"
      data-tt-admin-dispute-adjudication-desk="1"
      data-tt-admin-dispute-adjudication-variant={variant}
      data-tt-admin-dispute-write-forbidden="1"
      data-tt-admin-dispute-resolution-policy={desk.policy}
      data-tt-admin-dispute-escrow-write="FORBIDDEN"
    >
      {body}
    </aside>
  );
}
