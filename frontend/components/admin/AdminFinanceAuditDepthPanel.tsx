"use client";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";

import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";



function auditDepthLinks() {

  return [

    { href: "/admin/auth-audit-events", labelKey: "admin_fin_audit_depth_link_auth" },

    { href: "/admin/audit/operations", labelKey: "admin_fin_audit_depth_link_operations" },

    {

      href: adminFinancePartialDepthHref("/admin/finance", "export"),

      labelKey: "admin_fin_audit_depth_link_export",

    },

  ] as const;

}



type Props = {

  entryCount: number;

  latestAction: string | null;

  latestActor: string | null;

  loading: boolean;

  error: boolean;

};



/** FIN-02 · ① 审计导出模块页内深度（② 审计包另闸）。 */

export function AdminFinanceAuditDepthPanel({

  entryCount,

  latestAction,

  latestActor,

  loading,

  error,

}: Props) {

  const { t } = useTranslation();



  return (

    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"

      aria-label={t("admin_fin_audit_depth_aria")}

      data-tt-admin-fin-audit-depth="1"

    >

      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_audit_depth_title")}</h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_fin_audit_depth_lead")}</p>



      {loading ? (

        <p className="mt-3 text-small text-ink-600">{t("admin_loading")}</p>

      ) : error ? (

        <p className="mt-3 text-small text-ink-600">{t("admin_fin_audit_depth_load_failed")}</p>

      ) : (

        <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2">

          <div>

            <dt className="font-medium text-ink-700">{t("admin_fin_audit_depth_entries")}</dt>

            <dd className="mt-0.5 text-ink-900" data-tt-admin-fin-audit-depth-count="1">

              {entryCount}

            </dd>

          </div>

          <div>

            <dt className="font-medium text-ink-700">{t("admin_fin_audit_depth_latest")}</dt>

            <dd className="mt-0.5 text-meta text-ink-800">

              {latestAction ?? "—"}

              {latestActor ? ` · ${latestActor}` : ""}

            </dd>

          </div>

        </dl>

      )}



      <AdminFinanceDepthActionLinks links={auditDepthLinks()} />

    </AdminWarmL5Surface>

  );

}

