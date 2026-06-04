"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { adminFilterChipClass } from "@/lib/adminUi";
import { travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";

const PRESETS: { action: string; labelKey: string }[] = [
  { action: "", labelKey: "admin_audit_preset_all" },
  { action: "admin.approvals.approve", labelKey: "admin_audit_preset_approvals" },
  { action: "admin.users.role", labelKey: "admin_audit_preset_users" },
  { action: "admin.community", labelKey: "admin_audit_preset_community" },
];

export function AdminAuditQuickFilters(props: {
  currentAction: string;
  onPick: (action: string) => void;
}) {
  const { t } = useTranslation();
  const cur = props.currentAction.trim();

  return (
    <div className="mt-3 flex flex-wrap gap-2" data-tt-admin-audit-presets="1" role="group" aria-label={t("admin_audit_presets_aria")}>
      {PRESETS.map(({ action, labelKey }) => {
        const active = cur === action || (!cur && !action);
        return (
          <button
            key={labelKey}
            type="button"
            className={`inline-flex min-h-[44px] items-center rounded-full border px-3 py-1.5 text-small font-medium ${travelFocusRingCoreOffset2WhiteClasses} ${adminFilterChipClass(active)}`}
            aria-pressed={active}
            onClick={() => props.onPick(action)}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
