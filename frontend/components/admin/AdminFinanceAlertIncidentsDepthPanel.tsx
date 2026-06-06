"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthActionLinks } from "@/components/admin/AdminFinanceDepthActionLinks";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

function alertIncidentsDepthLinks(syncedIncidentId: string | null) {
  const links = [
    {
      href: adminFinancePartialDepthHref("/admin/observability", "observability"),
      labelKey: "admin_fin_alert_incidents_depth_link_observability",
    },
    { href: "/admin/finance-suite", labelKey: "admin_fin_cross_check_depth_link_suite" },
  ] as const;
  if (syncedIncidentId) {
    return [
      {
        href: `/admin/alerts/incidents/${encodeURIComponent(syncedIncidentId)}`,
        labelKey: "admin_fin_alert_incidents_depth_link_open",
      },
      ...links,
    ] as const;
  }
  return links;
}

type Props = {
  syncedIncidentId: string | null;
  hasSyncedIncident: boolean;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 告警事件枢纽 partial 深度。 */
export function AdminFinanceAlertIncidentsDepthPanel({
  syncedIncidentId,
  hasSyncedIncident,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      className="mb-4"
      data-tt-admin-fin-depth-panel="1"
      aria-label={t("admin_fin_alert_incidents_depth_aria")}
      data-tt-admin-fin-alert-incidents-depth="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_alert_incidents_depth_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_alert_incidents_depth_lead")}</p>

      {loading ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_loading")}</p>
      ) : error ? (
        <p className="mt-3 text-small text-ink-500">{t("admin_fin_alert_incidents_depth_load_failed")}</p>
      ) : (
        <dl className="mt-3 space-y-2 text-small" data-tt-admin-fin-alert-incidents-depth-snapshot="1">
          <div>
            <dt className="font-medium text-ink-700">{t("admin_fin_alert_incidents_depth_sync")}</dt>
            <dd className="mt-0.5 font-mono text-meta text-ink-800 break-all">
              {hasSyncedIncident && syncedIncidentId
                ? syncedIncidentId
                : t("admin_fin_alert_incidents_depth_sync_none")}
            </dd>
          </div>
        </dl>
      )}

      <AdminFinanceDepthActionLinks links={alertIncidentsDepthLinks(syncedIncidentId)} />
    </AdminWarmL5Surface>
  );
}
