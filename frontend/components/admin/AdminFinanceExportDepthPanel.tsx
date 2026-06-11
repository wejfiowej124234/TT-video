"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthHonestyFooter } from "@/components/admin/AdminFinanceDepthHonestyFooter";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_PRIMARY_ACTION_BTN_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_FIN_DEPTH_PANEL_CLASS } from "@/lib/adminUi";

type Props = {
  exporting: boolean;
  onExport: () => void;
  meta: Record<string, unknown> | null;
};

export function AdminFinanceExportDepthPanel({ exporting, onExport, meta }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const maintainer = isAdminMaintainerUi(caps.role);
  const buildSha =
    maintainer && meta && typeof meta.git_sha === "string" ? meta.git_sha : null;

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"
      aria-label={t("admin_fin_export_depth_aria")}
      data-tt-admin-fin-export-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_export_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_export_depth_lead")}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-small text-ink-700">
        <li>{t("admin_fin_export_depth_step_1")}</li>
        <li>{t("admin_fin_export_depth_step_2")}</li>
        <li>{t("admin_fin_export_depth_step_3")}</li>
      </ol>
      <div className="mt-4" data-tt-admin-fin-depth-actions="1">
        <button
          type="button"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          disabled={exporting}
          onClick={onExport}
          data-tt-admin-fin-export-depth-submit="1"
        >
          {exporting ? t("admin_finance_exporting") : t("admin_fin_export_depth_cta")}
        </button>
      </div>
      {buildSha ? (
        <p className="mt-2 font-mono text-meta text-ink-500">
          {t("admin_fin_export_depth_build", { sha: buildSha })}
        </p>
      ) : null}
      <AdminFinanceDepthHonestyFooter />
    </AdminWarmL5Surface>
  );
}
