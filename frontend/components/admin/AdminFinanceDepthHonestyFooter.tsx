"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** FIN-02 · ① partial 深度面板页脚诚实说明（非 ② PSP/结算 GO）。 */
export function AdminFinanceDepthHonestyFooter() {
  const { t } = useTranslation();

  return (
    <p
      className="mt-4 border-t border-ink-100 pt-3 text-meta text-ink-500"
      role="note"
      data-tt-admin-fin-depth-honesty-footer="1"
    >
      {t("admin_fin_depth_honesty_footer")}
    </p>
  );
}
