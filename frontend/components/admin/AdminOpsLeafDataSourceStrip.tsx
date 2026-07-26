"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  resolveOpsListDataSourceStrip,
  type OpsDataSourceTone,
  type OpsFourLeafId,
} from "@/lib/admin/opsWorkbenchL5";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";

type Props = {
  leaf: OpsFourLeafId;
  meta: Record<string, unknown> | null | undefined;
  /** HU-420 · users leaf forces explicit meta.source marker */
  emphasizeUsersDrift?: boolean;
};

function toneClass(tone: OpsDataSourceTone): string {
  if (tone === "unavailable") return "border-warning/50 bg-warning/5 text-warning";
  if (tone === "memory") return "border-ref-sun/40 bg-bg-console/50 text-ink-800";
  if (tone === "mixed") return "border-ink-300 bg-bg-console/40 text-ink-700";
  return "border-ink-200 bg-bg-console/30 text-ink-600";
}

/** Batch-11 HU-412 / HU-420 · 经营四叶列表强制数据源条（fail-closed） */
export function AdminOpsLeafDataSourceStrip({ leaf, meta, emphasizeUsersDrift }: Props) {
  const { t } = useTranslation();
  const strip = resolveOpsListDataSourceStrip(meta);

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border px-4 py-3 ${ADMIN_FILTER_CARD_CLASS} ${toneClass(strip.tone)}`}
      role="note"
      data-tt-admin-ops-leaf-data-source="1"
      data-tt-admin-ops-leaf-id={leaf}
      data-tt-admin-ops-leaf-data-source-tone={strip.tone}
      data-tt-admin-ops-four-leaf-memory-risk={
        strip.tone === "memory" || strip.tone === "unavailable" ? "1" : undefined
      }
      data-tt-admin-users-meta-source={emphasizeUsersDrift || leaf === "users" ? "1" : undefined}
    >
      <p className="text-body font-medium">{t("admin_ops_leaf_data_source_title")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t(strip.labelKey)}</p>
      {leaf === "users" ? (
        <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`} data-tt-admin-users-drift-note="1">
          {t("admin_ops_users_meta_source_lead")}
        </p>
      ) : null}
      {strip.metaSource ? (
        <p
          className="mt-1 font-mono text-meta"
          data-tt-admin-ops-meta-source={strip.metaSource}
        >
          meta.source={strip.metaSource}
        </p>
      ) : (
        <p className="mt-1 font-mono text-meta" data-tt-admin-ops-meta-source-missing="1">
          meta.source=—
        </p>
      )}
    </aside>
  );
}
