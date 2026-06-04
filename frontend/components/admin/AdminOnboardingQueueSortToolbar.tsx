"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { adminFilterChipClass, ADMIN_MOTION_COLOR_TRANSITION_CLASS } from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import type { OnboardingQueueSortKey } from "@/lib/admin/sortOnboardingQueueItems";
import type { AdminTableSortDir } from "@/lib/admin/useAdminTableSort";

/** 商家/管家入驻队列 · 卡片列表排序（①）。 */
export function AdminOnboardingQueueSortToolbar(props: {
  sortKey: OnboardingQueueSortKey;
  sortDir: AdminTableSortDir;
  onSelect: (key: OnboardingQueueSortKey) => void;
}) {
  const { t } = useTranslation();
  const { sortKey, sortDir, onSelect } = props;

  const chip = (key: OnboardingQueueSortKey, labelKey: string) => {
    const active = sortKey === key;
    const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : "";
    return (
      <button
        type="button"
        key={key}
        data-tt-admin-onboarding-sort={key}
        aria-pressed={active}
        onClick={() => onSelect(key)}
        className={`inline-flex min-h-[44px] items-center rounded-full border px-3 text-small font-medium ${ADMIN_MOTION_COLOR_TRANSITION_CLASS} ${adminFilterChipClass(active)} ${travelFocusRingOffset2Classes}`}
      >
        {t(labelKey)}
        <span className="text-meta tabular-nums" aria-hidden>
          {arrow}
        </span>
      </button>
    );
  };

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-2"
      role="group"
      aria-label={t("admin_onboarding_sort_aria")}
      data-tt-admin-onboarding-queue-sort="1"
    >
      <span className="text-small text-ink-600">{t("admin_onboarding_sort_label")}</span>
      {chip("submitted_at", "admin_onboarding_sort_submitted")}
      {chip("status", "admin_onboarding_sort_status")}
    </div>
  );
}
