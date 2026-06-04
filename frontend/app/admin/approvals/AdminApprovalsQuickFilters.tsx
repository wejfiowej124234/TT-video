"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_FOCUS_RING_CORE_CLASS, adminFilterChipClass } from "@/lib/adminUi";

import type { AdminApprovalsPageViewModel } from "./useAdminApprovalsPage";

const CHIPS: { status: string; labelKey: string }[] = [
  { status: "pending", labelKey: "admin_approvals_optPending" },
  { status: "approved", labelKey: "admin_approvals_optApproved" },
  { status: "rejected", labelKey: "admin_approvals_optRejected" },
  { status: "cancelled", labelKey: "admin_approvals_optCancelled" },
  { status: "", labelKey: "admin_approvals_optAll" },
];

type Props = { vm: AdminApprovalsPageViewModel };

export function AdminApprovalsQuickFilters({ vm }: Props) {
  const { t } = useTranslation();
  const active = vm.listQ.status === undefined ? "" : vm.listQ.status;

  return (
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("admin_approvals_quick_filters_aria")}>
      {CHIPS.map(({ status, labelKey }) => {
        const isActive = active === status;
        return (
          <button
            key={status || "all"}
            type="button"
            className={`inline-flex min-h-[44px] items-center rounded-full border px-3 py-1.5 text-small font-medium ${adminFilterChipClass(isActive)} ${ADMIN_FOCUS_RING_CORE_CLASS}`}
            aria-pressed={isActive}
            onClick={() => vm.setStatusQuick(status)}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
