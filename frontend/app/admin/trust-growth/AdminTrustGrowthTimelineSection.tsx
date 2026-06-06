"use client";

import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { ADMIN_TABLE_ROW_CLASS, ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_ROW_DIVIDER_CLASS,} from "@/lib/adminUi";

import type { ObsBody } from "./adminTrustGrowthPageModel";

type TrustGrowthTimelineSortKey = "generation" | "recorded_at";

type AdminTrustGrowthTimelineSectionProps = {
  generationHistory: NonNullable<ObsBody["generation_history"]>;
};

export function AdminTrustGrowthTimelineSection({
  generationHistory: genHist,
}: AdminTrustGrowthTimelineSectionProps) {
  const { t } = useTranslation();
  const { sort, toggle, ariaSort } = useAdminTableSort<TrustGrowthTimelineSortKey>("recorded_at", "desc");

  const sortedHist = useMemo(
    () =>
      sortRowsByKey(genHist, sort.key, sort.dir, (row, key) => {
        if (key === "generation") return row.autopilot_generation ?? 0;
        return row.recorded_at ?? "";
      }),
    [genHist, sort.key, sort.dir],
  );

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_trust_growth_section_timeline")}
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_timeline")}
      </h2>
      <div className="mt-3 max-h-48 overflow-auto">
        <table className="w-full border-collapse text-left text-meta">
          <thead className={ADMIN_TABLE_THEAD_CLASS}>
            <tr className={`${ADMIN_TABLE_ROW_DIVIDER_CLASS} text-ink-500`}>
              <AdminSortableTh
                label={t("admin_trust_growth_generation")}
                ariaSort={ariaSort("generation")}
                onToggle={() => toggle("generation")}
              />
              <AdminSortableTh
                label={t("admin_trust_growth_recorded_at")}
                ariaSort={ariaSort("recorded_at")}
                onToggle={() => toggle("recorded_at")}
              />
            </tr>
          </thead>
          <tbody>
            {sortedHist.map((h, idx) => (
              <tr
                key={`${h.autopilot_generation}-${idx}`}
                className={`font-mono text-ink-800 ${ADMIN_TABLE_ROW_CLASS}`}
              >
                <td className="py-1 pr-2">{h.autopilot_generation}</td>
                <td className="py-1">{h.recorded_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminWarmL5Surface>
  );
}
