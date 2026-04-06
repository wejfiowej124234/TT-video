"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 07 §5.2A / 13-1：治理域全站一致的「文档镜像·非承诺」披露（与 governance_hub_target_notice 同读）。 */
export default function GovernanceTargetNotice({ className = "mt-4" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p
      className={`rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 px-4 py-3 text-small text-ink-800 dark:border-warning/40 dark:bg-warning/15 dark:text-white/95 ${className}`}
      role="note"
    >
      {t("governance_hub_target_notice")}
    </p>
  );
}
