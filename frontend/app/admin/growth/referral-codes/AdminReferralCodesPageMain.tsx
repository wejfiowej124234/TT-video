"use client";



import { useId } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsPlanePermissionBanners } from "@/components/admin/ops/AdminOpsPlanePermissionBanners";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import {

  OfficialOpsDataTable,

  OfficialOpsTableBody,

  OfficialOpsTableHead,

  OfficialOpsTableTh,

} from "@/components/admin/ops/OfficialOpsDataTable";



import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";

import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";

import {

  ADMIN_FILTER_CARD_CLASS,

  ADMIN_FILTER_FIELD_LABEL_CLASS,

  ADMIN_FILTER_INPUT_SM_CLASS,

  ADMIN_TABLE_TD_CELL_CLASS,

  adminTableRowPrimaryActionClass,

} from "@/lib/adminUi";



import { useAdminReferralCodesPage } from "./useAdminReferralCodesPage";



export function AdminReferralCodesPageMain() {

  const { t } = useTranslation();

  const titleId = useId();

  const {

    items,

    loading,

    error,

    busy,

    ownerUserId,

    setOwnerUserId,

    codeType,

    setCodeType,

    customCode,

    setCustomCode,

    label,

    setLabel,

    maxUses,

    setMaxUses,

    handleCreate,

    toggleActive,

    codeTypes,

    reload,

  } = useAdminReferralCodesPage();



  return (

    <AdminDetailPageChrome

      titleId={titleId}

      title={t("admin_growth_referral_codes_title")}

      subtitle={t("admin_growth_referral_codes_subtitle")}

    >
      <AdminOpsPlanePermissionBanners read={ADMIN_PERM.GROWTH_READ} write={ADMIN_PERM.GROWTH_WRITE} publish={ADMIN_PERM.GROWTH_PUBLISH} />


      <AdminOpsRiskBanner messageKey="admin_ops_risk_banner_referral_codes" variant="info" />

      <form

        onSubmit={handleCreate}

        className={`mb-6 grid gap-3 md:grid-cols-2 ${ADMIN_FILTER_CARD_CLASS}`}

        data-tt-admin-growth-referral-create="1"

      >

        <label className="flex flex-col gap-1">

          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_referral_codes_owner_user_id")}</span>

          <input

            className={ADMIN_FILTER_INPUT_SM_CLASS}

            value={ownerUserId}

            onChange={(e) => setOwnerUserId(e.target.value)}

            required

          />

        </label>

        <label className="flex flex-col gap-1">

          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_referral_codes_code_type")}</span>

          <select

            className={ADMIN_FILTER_INPUT_SM_CLASS}

            value={codeType}

            onChange={(e) => setCodeType(e.target.value as (typeof codeTypes)[number])}

          >

            {codeTypes.map((ct) => (

              <option key={ct} value={ct}>

                {ct}

              </option>

            ))}

          </select>

        </label>

        <label className="flex flex-col gap-1">

          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_referral_codes_code_optional")}</span>

          <input

            className={ADMIN_FILTER_INPUT_SM_CLASS}

            value={customCode}

            onChange={(e) => setCustomCode(e.target.value)}

            placeholder="TT-KOL888"

          />

        </label>

        <label className="flex flex-col gap-1">

          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_referral_codes_label")}</span>

          <input

            className={ADMIN_FILTER_INPUT_SM_CLASS}

            value={label}

            onChange={(e) => setLabel(e.target.value)}

          />

        </label>

        <label className="flex flex-col gap-1">

          <span className={ADMIN_FILTER_FIELD_LABEL_CLASS}>{t("admin_growth_referral_codes_max_uses")}</span>

          <input

            className={ADMIN_FILTER_INPUT_SM_CLASS}

            type="number"

            min={1}

            value={maxUses}

            onChange={(e) => setMaxUses(e.target.value)}

          />

        </label>

        <div className="flex items-end">

          <button type="submit" disabled={busy} className={adminTableRowPrimaryActionClass()}>

            {t("admin_growth_referral_codes_create")}

          </button>

        </div>

      </form>



      <OpsPlaneFetchStates

        loading={loading}

        error={error}

        onRetry={() => void reload()}

        loadingMessageKey="ops_plane_loading"

        empty={!loading && !error && items.length === 0}

        emptyMessageKey="admin_growth_referral_codes_empty"

      >

        <OfficialOpsDataTable dataAttr="growth-referral-list">

          <OfficialOpsTableHead>

            <tr>

              <OfficialOpsTableTh>{t("admin_growth_referral_codes_col_code")}</OfficialOpsTableTh>

              <OfficialOpsTableTh>{t("admin_growth_referral_codes_col_type")}</OfficialOpsTableTh>

              <OfficialOpsTableTh>{t("admin_growth_referral_codes_col_uses")}</OfficialOpsTableTh>

              <OfficialOpsTableTh>{t("admin_growth_referral_codes_col_active")}</OfficialOpsTableTh>

              <OfficialOpsTableTh>{"\u00a0"}</OfficialOpsTableTh>

            </tr>

          </OfficialOpsTableHead>

          <OfficialOpsTableBody>

            {items.map((row) => (

              <tr key={row.id} data-tt-referral-code={row.code}>

                <td className={`${ADMIN_TABLE_TD_CELL_CLASS} font-mono`}>{row.code}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.code_type}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  {row.use_count}

                  {row.max_uses != null ? ` / ${row.max_uses}` : ""}

                </td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.is_active ? "✓" : "—"}</td>

                <td className={ADMIN_TABLE_TD_CELL_CLASS}>

                  <button

                    type="button"

                    disabled={busy}

                    className="text-ref-sun underline disabled:opacity-50"

                    onClick={() => void toggleActive(row)}

                  >

                    {row.is_active

                      ? t("admin_growth_referral_codes_disable")

                      : t("admin_growth_referral_codes_enable")}

                  </button>

                </td>

              </tr>

            ))}

          </OfficialOpsTableBody>

        </OfficialOpsDataTable>

      </OpsPlaneFetchStates>

    </AdminDetailPageChrome>

  );

}

