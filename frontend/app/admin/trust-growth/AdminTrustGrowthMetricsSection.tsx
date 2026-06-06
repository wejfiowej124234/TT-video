"use client";

import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_TABLE_ROW_CLASS, ADMIN_TABLE_THEAD_CLASS,
  ADMIN_CONSOLE_JSON_BLOCK_CLASS,
  ADMIN_TABLE_ROW_DIVIDER_CLASS,} from "@/lib/adminUi";

import {
  VARIANT_BAR_CLASS,
  formatCtr,
  formatPct,
  type MomentBlock,
  type ObsBody,
  type VariantRow,
} from "./adminTrustGrowthPageModel";

type TrustGrowthVariantSortKey = "variant_id" | "views" | "clicks" | "ctr" | "weight";

type AdminTrustGrowthMetricsSectionProps = {
  runtime: ObsBody["runtime"];
  moments: MomentBlock[];
};

function variantSortValue(row: VariantRow, key: TrustGrowthVariantSortKey): string | number | null | undefined {
  if (key === "variant_id") return row.variant_id ?? "";
  if (key === "views") return row.views ?? 0;
  if (key === "clicks") return row.clicks ?? 0;
  if (key === "ctr") return row.ctr ?? 0;
  return row.weight ?? null;
}

export function AdminTrustGrowthMetricsSection({ runtime: rt, moments }: AdminTrustGrowthMetricsSectionProps) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<TrustGrowthVariantSortKey>("views", "desc");

  const sortedMoments = useMemo(
    () =>
      moments.map((m) => ({
        ...m,
        variants: sortRowsByKey(m.variants ?? [], sort.key, sort.dir, (row, key) =>
          variantSortValue(row, key as TrustGrowthVariantSortKey),
        ),
      })),
    [moments, sort.key, sort.dir],
  );

  return (
    <section className="space-y-6" aria-label={t("admin_trust_growth_section_metrics")}>
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_metrics")}
      </h2>
      {sortedMoments.map((m) => (
        <AdminWarmL5Surface key={m.moment ?? "?"}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-body font-semibold text-ink-900">{m.moment ?? "—"}</h3>
            <span className="text-meta text-ink-500">
              {t("admin_trust_growth_total_views")}: {m.total_views ?? 0}
            </span>
          </div>

          <div className="mt-3" aria-hidden>
            <div className="flex h-4 w-full overflow-hidden rounded-sm bg-ref-sun/10">
              {(m.view_distribution ?? []).map((d) => {
                const vid = d.variant_id ?? "";
                const w = Math.max(0, (d.view_share ?? 0) * 100);
                const bar = VARIANT_BAR_CLASS[vid] ?? "bg-ref-sun/40";
                return (
                  <div
                    key={vid}
                    className={`${bar} min-w-0 transition-[width]`}
                    style={{ width: `${w}%` }}
                    title={`${vid}: ${formatPct(d.view_share)}`}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-meta text-ink-600">
              {(m.view_distribution ?? []).map((d) => (
                <span key={d.variant_id}>
                  <span className="font-mono">{d.variant_id}</span>: {formatPct(d.view_share)}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-small">
              <thead className={ADMIN_TABLE_THEAD_CLASS}>
                <tr className={`${ADMIN_TABLE_ROW_DIVIDER_CLASS} text-meta text-ink-500`}>
                  <AdminSortableTh
                    label={t("admin_trust_growth_variant")}
                    ariaSort={ariaSort("variant_id")}
                    onToggle={() => toggle("variant_id")}
                  />
                  <AdminSortableTh
                    label={t("admin_trust_growth_views")}
                    ariaSort={ariaSort("views")}
                    onToggle={() => toggle("views")}
                  />
                  <AdminSortableTh
                    label={t("admin_trust_growth_clicks")}
                    ariaSort={ariaSort("clicks")}
                    onToggle={() => toggle("clicks")}
                  />
                  <AdminSortableTh
                    label={t("admin_trust_growth_ctr")}
                    ariaSort={ariaSort("ctr")}
                    onToggle={() => toggle("ctr")}
                  />
                  <AdminSortableTh
                    label={t("admin_trust_growth_weight")}
                    ariaSort={ariaSort("weight")}
                    onToggle={() => toggle("weight")}
                  />
                </tr>
              </thead>
              <tbody>
                {(m.variants ?? []).map((v) => (
                  <tr key={v.variant_id} className={`font-mono text-ink-800 ${ADMIN_TABLE_ROW_CLASS}`}>
                    <td className="py-2 pr-2">{v.variant_id}</td>
                    <td className="py-2 pr-2">{v.views ?? 0}</td>
                    <td className="py-2 pr-2">{v.clicks ?? 0}</td>
                    <td className="py-2 pr-2">{formatCtr(v.ctr)}</td>
                    <td className="py-2">{v.weight !== undefined ? v.weight.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-small text-ink-700 hover:underline">
              {t("admin_trust_growth_weights_json")}
            </summary>
            <pre className={`mt-2 max-h-40 overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
              {JSON.stringify(rt?.moments?.[m.moment ?? ""] ?? {}, null, 2)}
            </pre>
          </details>
        </AdminWarmL5Surface>
      ))}
    </section>
  );
}
