"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

import type { ObsBody } from "./adminTrustGrowthPageModel";

type AdminTrustGrowthKpiSectionProps = {
  data: ObsBody;
};

export function AdminTrustGrowthKpiSection({ data }: AdminTrustGrowthKpiSectionProps) {
  const { t } = useTranslation();
  const rt = data.runtime;

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_trust_growth_section_kpi")}
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_kpi")}
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-meta text-ink-500">{t("admin_trust_growth_env")}</dt>
          <dd className="font-mono text-body text-ink-900">{data.environment ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-meta text-ink-500">{t("admin_trust_growth_generation")}</dt>
          <dd className="font-mono text-body text-ink-900">{rt?.autopilot_generation ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-meta text-ink-500">{t("admin_trust_growth_runtime_updated")}</dt>
          <dd className="font-mono text-small text-ink-900">{rt?.updated_at ?? "—"}</dd>
        </div>
      </dl>
    </AdminWarmL5Surface>
  );
}
