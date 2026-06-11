"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_CONSOLE_JSON_BLOCK_CLASS } from "@/lib/adminUi";

import type { ObsBody } from "./adminTrustGrowthPageModel";

type AdminTrustGrowthThresholdsSectionProps = {
  thresholds: ObsBody["thresholds"];
};

export function AdminTrustGrowthThresholdsSection({ thresholds }: AdminTrustGrowthThresholdsSectionProps) {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_trust_growth_section_thresholds")}
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_thresholds")}
      </h2>
      <pre className={`mt-2 max-h-48 overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
        {JSON.stringify(thresholds ?? {}, null, 2)}
      </pre>
    </AdminWarmL5Surface>
  );
}
