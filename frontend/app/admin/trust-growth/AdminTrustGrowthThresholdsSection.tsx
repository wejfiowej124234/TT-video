"use client";

import { useTranslation } from "@/components/LocaleProvider";

import type { ObsBody } from "./adminTrustGrowthPageModel";

type AdminTrustGrowthThresholdsSectionProps = {
  thresholds: ObsBody["thresholds"];
};

export function AdminTrustGrowthThresholdsSection({ thresholds }: AdminTrustGrowthThresholdsSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4"
      aria-label={t("admin_trust_growth_section_thresholds")}
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_thresholds")}
      </h2>
      <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
        {JSON.stringify(thresholds ?? {}, null, 2)}
      </pre>
    </section>
  );
}
