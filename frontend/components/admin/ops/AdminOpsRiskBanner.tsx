"use client";

import { useTranslation } from "@/components/LocaleProvider";

import { ADMIN_NOTICE_INFO_CLASS, ADMIN_NOTICE_WARNING_CLASS } from "@/lib/adminUi";

type Props = {
  messageKey: string;
  variant?: "warning" | "info";
};

/** Ops-plane risk / scope banner (publish · deploy · analytics source). */
export function AdminOpsRiskBanner({ messageKey, variant = "warning" }: Props) {
  const { t } = useTranslation();
  const tone = variant === "info" ? ADMIN_NOTICE_INFO_CLASS : ADMIN_NOTICE_WARNING_CLASS;
  return (
    <div
      role="note"
      className={`mb-4 rounded-lg px-4 py-3 text-body-s ${tone}`}
      data-tt-admin-ops-risk-banner={variant}
    >
      {t(messageKey)}
    </div>
  );
}
