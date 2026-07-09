"use client";

import { useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { adminConfirmOfficialPublish } from "@/lib/admin/adminOpsWriteConfirm";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import { patchAdminOfficialPublicOperationsFeatured } from "@/lib/apiClient";

import {
  useAdminOfficialPublicOperationsDisplayList,
  type PublicOpsEntityType,
} from "./useAdminOfficialPublicOperationsDisplayList";

const ENTITY_TYPES: PublicOpsEntityType[] = ["guides", "orders", "market_listings", "community_posts"];

export function AdminOfficialPublicOperationsFeaturedPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [entityType, setEntityType] = useState<PublicOpsEntityType>("guides");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const { items, loading, error, reload } = useAdminOfficialPublicOperationsDisplayList(entityType, {
    displayStatus: "published",
    featuredOnly: featuredOnly || undefined,
  });

  async function toggleFeatured(row: { id: string; entity_type: string; featured: boolean }) {
    setBusy(true);
    try {
      const res = await patchAdminOfficialPublicOperationsFeatured(
        row.entity_type,
        row.id,
        !row.featured,
      );
      if (res.status === "ok") await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-featured="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_featured")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_featured_risk_banner" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_public_operations_publish_entity_type")}</span>
          <select
            className={ADMIN_FILTER_INPUT_SM_CLASS}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as PublicOpsEntityType)}
          >
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-small">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => setFeaturedOnly(e.target.checked)}
          />
          {t("admin_public_operations_featured_only_filter")}
        </label>
        <button type="button" className={adminTableRowPrimaryActionClass()} disabled={busy} onClick={() => void reload()}>
          {t("admin_public_operations_stats_refresh")}
        </button>
      </div>
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        <OfficialOpsDataTable dataAttr="public-operations-featured-list">
          <OfficialOpsTableHead>
            <tr>
              <OfficialOpsTableTh>{t("admin_public_operations_publish_col_label")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_featured")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_public_operations_col_priority")}</OfficialOpsTableTh>
              <OfficialOpsTableTh>{t("admin_content_col_actions")}</OfficialOpsTableTh>
            </tr>
          </OfficialOpsTableHead>
          <OfficialOpsTableBody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className={ADMIN_TABLE_TD_CELL_CLASS}>
                  {t("admin_public_operations_stats_empty")}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.label}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.featured ? "true" : "false"}</td>
                  <td className={`${ADMIN_TABLE_TD_CELL_CLASS} tabular-nums`}>{row.display_priority}</td>
                  <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                    <button
                      type="button"
                      disabled={busy}
                      className="underline"
                      data-tt-admin-public-operations-featured-toggle="1"
                      onClick={() =>
                        requestConfirm(
                          adminConfirmOfficialPublish(() => toggleFeatured(row)),
                        )
                      }
                    >
                      {row.featured
                        ? t("admin_public_operations_action_unfeature")
                        : t("admin_public_operations_action_feature")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </OfficialOpsTableBody>
        </OfficialOpsDataTable>
      </OpsPlaneFetchStates>
    </section>
  );
}
