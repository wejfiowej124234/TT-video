"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import {
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

import { useAdminCountryMarketPage } from "./useAdminCountryMarketPage";

export function AdminCountryMarketPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { items, loading, error, reload } = useAdminCountryMarketPage();

  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_country_market_title"
      subtitleKey="admin_country_market_subtitle"
      loading={loading}
      error={error}
      onRetry={() => void reload()}
      empty={!loading && !error && items.length === 0}
      emptyMessageKey="admin_country_market_empty"
    >
      <div className="mb-4">
        <button
          type="button"
          className={adminTableRowPrimaryActionClass()}
          disabled={loading}
          onClick={() => void reload()}
        >
          {t("admin_country_market_reload")}
        </button>
      </div>
      <div data-tt-admin-country-market-launches="1">
        <OfficialOpsDataTable dataAttr="country-market-launches">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_country_market_iso")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_country_market_phase")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_country_market_launched_at")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.map((row) => (
              <tr key={row.id}>
                <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.jurisdiction_iso}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.phase}</td>
                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.launched_at ?? "—"}</td>
              </tr>
            ))}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </div>
    </AdminContentPageShell>
  );
}
