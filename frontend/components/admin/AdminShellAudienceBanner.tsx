"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** Operator-only audience banner — isolates Admin console from traveler/merchant product surfaces. */
export function AdminShellAudienceBanner() {
  const { t } = useTranslation();
  return (
    <aside
      className="border-b border-ref-sun/25 bg-ref-sun/[0.07] px-4 py-2 text-meta text-ink-800"
      data-tt-admin-shell-audience-banner="1"
      role="note"
    >
      <p className="font-semibold text-ink-900">{t("admin_shell_audience_banner_title")}</p>
      <p className="mt-0.5 text-ink-600">{t("admin_shell_audience_banner_body")}</p>
    </aside>
  );
}
