"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  resolveGuidesInventorySnapshot,
  type GuidesInventorySnapshot,
} from "@/lib/admin/guidesTriangleL5";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_TEXT_FOOTNOTE_CLASS, ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";

type Props = {
  loadedCount: number;
  apiTotal?: number | null;
  loading?: boolean;
};

/** Batch-11 HU-417 · 向导目录库存 / 列表 total 诚实条 */
export function AdminGuidesInventoryStrip({ loadedCount, apiTotal = null, loading }: Props) {
  const { t } = useTranslation();
  const snap: GuidesInventorySnapshot = resolveGuidesInventorySnapshot({
    apiTotal,
    loadedCount,
  });

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/40 px-4 py-3 ${ADMIN_FILTER_CARD_CLASS}`}
      role="status"
      data-tt-admin-guides-inventory="1"
      data-tt-admin-guides-inventory-kind={snap.kind}
      data-tt-admin-guides-inventory-total={snap.total != null ? String(snap.total) : "null"}
      data-tt-admin-guides-inventory-loaded={String(snap.loaded)}
    >
      <p className="text-body font-medium text-ink-800">{t("admin_guides_inventory_title")}</p>
      {loading ? (
        <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_loading")}</p>
      ) : (
        <>
          <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`} data-tt-admin-guides-inventory-value="1">
            {snap.kind === "api_total"
              ? t("admin_guides_inventory_total_value", { total: snap.total ?? 0, loaded: snap.loaded })
              : t("admin_guides_inventory_snapshot_value", { loaded: snap.loaded })}
          </p>
          <p className={`mt-1 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>{t(snap.honestyKey)}</p>
        </>
      )}
    </aside>
  );
}
