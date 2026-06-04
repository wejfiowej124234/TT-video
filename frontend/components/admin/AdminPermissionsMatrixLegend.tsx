"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS,
  ADMIN_ROLE_MATRIX_DIFF_TEXT_CLASS,
} from "@/lib/adminUi";

/** 权限矩阵高亮图例（① · 对照当前角色差异行）。 */
export function AdminPermissionsMatrixLegend() {
  const { t } = useTranslation();

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-4 text-small text-ink-600"
      data-tt-admin-permissions-matrix-legend="1"
      aria-label={t("admin_permissions_matrix_legend_aria")}
    >
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded border border-ink-200 bg-ink-50/80" aria-hidden />
        {t("admin_permissions_matrix_legend_current")}
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className={`inline-block h-3 w-6 rounded border border-ink-200 ${ADMIN_ROLE_MATRIX_DIFF_ROW_CLASS}`}
          aria-hidden
        />
        <span className={ADMIN_ROLE_MATRIX_DIFF_TEXT_CLASS}>
          {t("admin_permissions_matrix_legend_diff")}
        </span>
      </span>
    </div>
  );
}
