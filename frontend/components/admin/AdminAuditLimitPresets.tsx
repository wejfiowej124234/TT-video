"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { adminFilterChipClass } from "@/lib/adminUi";
import { travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

const LIMITS = [50, 100, 200] as const;

/** 审计列表「深度」预设（API 无时间窗时的 ① 折中，AUD-01）。 */
export function AdminAuditLimitPresets(props: { currentLimit: number; onPick: (limit: number) => void }) {
  const { t } = useTranslation();
  const cur = props.currentLimit;

  return (
    <div
      className="mt-2 flex flex-wrap gap-2"
      data-tt-admin-audit-limit-presets="1"
      role="group"
      aria-label={t("admin_audit_limit_presets_aria")}
    >
      {LIMITS.map((n) => {
        const active = cur === n;
        return (
          <button
            key={n}
            type="button"
            className={`inline-flex min-h-[44px] items-center rounded-full border px-3 py-1.5 text-small font-medium ${travelFocusRingCoreOffset2WhiteClasses} ${adminFilterChipClass(active)}`}
            aria-pressed={active}
            onClick={() => props.onPick(n)}
          >
            {t("admin_audit_limit_preset", { n: String(n) })}
          </button>
        );
      })}
    </div>
  );
}
