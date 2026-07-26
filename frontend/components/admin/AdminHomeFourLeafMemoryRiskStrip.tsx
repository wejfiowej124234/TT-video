"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  OPS_FOUR_LEAF_IDS,
  resolveFourLeafHomeMemoryRiskMode,
} from "@/lib/admin/opsWorkbenchL5";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const HREF: Record<(typeof OPS_FOUR_LEAF_IDS)[number], string> = {
  users: "/admin/users",
  guides: "/admin/guides",
  orders: "/admin/orders",
  disputes: "/admin/disputes",
};

const LABEL_KEY: Record<(typeof OPS_FOUR_LEAF_IDS)[number], string> = {
  users: "admin_ops_four_leaf_users",
  guides: "admin_ops_four_leaf_guides",
  orders: "admin_ops_four_leaf_orders",
  disputes: "admin_ops_four_leaf_disputes",
};

type Props = {
  /** overview metrics.source */
  metricsSource?: string | null;
  /** KPI list meta.source merge */
  kpiSource?: string | null;
};

/**
 * Batch-11 HU-412 · 经营四叶可能为 MEMORY · 非 REAL_DB 签字（诚实保留）
 * Batch-12 HU-433 · 默认一行摘要 +「详情」展开，避免长文挡指挥台
 * Batch-12 HU-456 · 仅 memory/unknown 显示风险条；REAL_DB 双源 → OK 芯片
 */
export function AdminHomeFourLeafMemoryRiskStrip(props: Props = {}) {
  const { t } = useTranslation();
  const mode = resolveFourLeafHomeMemoryRiskMode(props.metricsSource, props.kpiSource);

  if (mode === "real_db_ok") {
    return (
      <aside
        className={`rounded-[var(--radius-md)] border border-ink-200/60 bg-bg-console/30 px-4 py-2 ${ADMIN_FILTER_CARD_CLASS}`}
        role="status"
        data-tt-admin-ops-four-leaf-real-db-ok="1"
        data-tt-admin-ops-four-leaf-banner="1"
      >
        <p className={`text-small font-medium ${ADMIN_TEXT_META_CLASS}`}>
          {t("admin_ops_four_leaf_real_db_ok")}
        </p>
      </aside>
    );
  }

  return (
    <details
      className={`group rounded-[var(--radius-md)] border border-ref-sun/40 bg-bg-console/50 px-4 py-2.5 ${ADMIN_FILTER_CARD_CLASS}`}
      role="note"
      data-tt-admin-ops-four-leaf-memory-risk="1"
      data-tt-admin-ops-four-leaf-banner="1"
      data-tt-admin-ops-four-leaf-memory-collapsed-default="1"
    >
      <summary
        className={`flex cursor-pointer list-none items-start justify-between gap-3 text-small font-medium text-ink-800 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
        data-tt-admin-ops-four-leaf-memory-summary="1"
      >
        <span className="min-w-0">
          <span className="block">{t("admin_ops_four_leaf_memory_title")}</span>
          <span className={`mt-0.5 block font-normal ${ADMIN_TEXT_META_CLASS}`}>
            {t("admin_ops_four_leaf_memory_summary")}
          </span>
        </span>
        <span
          className={`shrink-0 text-small font-semibold ${ADMIN_INLINE_LINK_CLASS} group-open:hidden`}
          data-tt-admin-ops-four-leaf-memory-expand="1"
        >
          {t("admin_ops_four_leaf_memory_details")}
        </span>
        <span
          className={`hidden shrink-0 text-small font-semibold ${ADMIN_INLINE_LINK_CLASS} group-open:inline`}
        >
          {t("admin_ops_four_leaf_memory_details_hide")}
        </span>
      </summary>
      <div className="mt-2 border-t border-white/10 pt-2" data-tt-admin-ops-four-leaf-memory-body="1">
        <p className={ADMIN_TEXT_META_CLASS}>{t("admin_ops_four_leaf_memory_lead")}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {OPS_FOUR_LEAF_IDS.map((id) => (
            <li key={id}>
              <Link
                href={HREF[id]}
                className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
                data-tt-admin-ops-four-leaf-link={id}
              >
                {t(LABEL_KEY[id])}
              </Link>
            </li>
          ))}
        </ul>
        <p className={`mt-2 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>{t("admin_ops_four_leaf_memory_footnote")}</p>
      </div>
    </details>
  );
}
