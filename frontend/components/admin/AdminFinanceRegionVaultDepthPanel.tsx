"use client";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";

import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";



function vaultDepthLinks() {

  return [

    {

      href: adminFinancePartialDepthHref("/admin/fee-router", "fee-router"),

      labelKey: "admin_fin_vault_depth_link_fee_router",

    },

    {

      href: adminFinancePartialDepthHref("/admin/finance", "finance-summary"),

      labelKey: "admin_fin_vault_depth_link_settlement",

    },

    { href: "/admin/indexer", labelKey: "admin_fin_vault_depth_link_indexer" },

  ] as const;

}



type Props = {

  total: number | null;

  minBlock: number | null;

  maxBlock: number | null;

  latestInserted: string | null;

  loading: boolean;

  error: boolean;

};



/** FIN-02 · ① 区域金库页内深度（② 链上结算闭环另闸）。 */

export function AdminFinanceRegionVaultDepthPanel({

  total,

  minBlock,

  maxBlock,

  latestInserted,

  loading,

  error,

}: Props) {

  const { t } = useTranslation();



  return (

    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"

      aria-label={t("admin_fin_vault_depth_aria")}

      data-tt-admin-fin-region-vault-depth="1"

    >

      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_vault_depth_title")}</h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_fin_vault_depth_lead")}</p>



      {loading ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>

      ) : error ? (

        <p className="mt-3 text-small text-ink-500">{t("admin_fin_vault_depth_load_failed")}</p>

      ) : (

        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2" data-tt-admin-fin-vault-depth-snapshot="1">

          <div>

            <dt className="font-medium text-ink-700">{t("admin_fin_vault_depth_total")}</dt>

            <dd className="mt-0.5 text-ink-900">{total ?? "—"}</dd>

          </div>

          <div>

            <dt className="font-medium text-ink-700">{t("admin_fin_vault_depth_blocks")}</dt>

            <dd className="mt-0.5 text-meta text-ink-800">

              {minBlock ?? "—"} → {maxBlock ?? "—"}

            </dd>

          </div>

          {latestInserted ? (

            <div className="sm:col-span-2">

              <dt className="font-medium text-ink-700">{t("admin_fin_vault_depth_latest")}</dt>

              <dd className="mt-0.5 text-meta text-ink-800">{latestInserted}</dd>

            </div>

          ) : null}

        </dl>

      )}



      <AdminFinanceDepthActionLinks links={vaultDepthLinks()} />

    </AdminWarmL5Surface>

  );

}

