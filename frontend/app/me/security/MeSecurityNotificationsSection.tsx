"use client";

import type { SecurityNotificationItem } from "./meSecurityPageTypes";
import { isRiskNotification, notificationKey } from "./meSecurityPageNotify";
import type { MeSecurityPageViewModel } from "./useMeSecurityPage";
import { MeSettingsL5Panel } from "@/components/me/MeSettingsL5Panel";
import { ME_SECURITY_PANEL_IDS, TT_ME_SECURITY_L5 } from "@/lib/me/meSecurityL5";

type Props = Pick<
  MeSecurityPageViewModel,
  | "t"
  | "cellPh"
  | "formatTs"
  | "loading"
  | "loadAll"
  | "exportNotificationsDisabled"
  | "notifStatus"
  | "setNotifStatus"
  | "notifEventType"
  | "setNotifEventType"
  | "notifLimit"
  | "setNotifLimit"
  | "riskOnlyFailed"
  | "setRiskOnlyFailed"
  | "riskOnlyPasswordRelated"
  | "setRiskOnlyPasswordRelated"
  | "exportNotificationsJson"
  | "visibleNotifications"
  | "expandedNotificationIds"
  | "toggleNotificationExpand"
>;

export function MeSecurityNotificationsSection({
  t,
  cellPh,
  formatTs,
  loading,
  loadAll,
  exportNotificationsDisabled,
  notifStatus,
  setNotifStatus,
  notifEventType,
  setNotifEventType,
  notifLimit,
  setNotifLimit,
  riskOnlyFailed,
  setRiskOnlyFailed,
  riskOnlyPasswordRelated,
  setRiskOnlyPasswordRelated,
  exportNotificationsJson,
  visibleNotifications,
  expandedNotificationIds,
  toggleNotificationExpand,
}: Props) {
  return (
    <MeSettingsL5Panel
      id={ME_SECURITY_PANEL_IDS.notifications}
      title={t("me_security_page_section_notifications")}
      actions={
        <button
          type="button"
          onClick={exportNotificationsJson}
          disabled={exportNotificationsDisabled}
          className={TT_ME_SECURITY_L5.btnSecondary}
        >
          {t("me_security_page_export_json")}
        </button>
      }
    >
      <div className={TT_ME_SECURITY_L5.filterRow}>
        <select
          value={notifStatus}
          onChange={(e) => setNotifStatus(e.target.value)}
          className={TT_ME_SECURITY_L5.select}
          aria-label={t("me_security_page_aria_notif_status")}
        >
          <option value="">{t("me_security_page_notif_all_statuses")}</option>
          <option value="pending">pending</option>
          <option value="sent">sent</option>
          <option value="failed">failed</option>
        </select>
        <input
          value={notifEventType}
          onChange={(e) => setNotifEventType(e.target.value)}
          placeholder={t("me_security_page_notif_event_placeholder")}
          className={`min-w-[140px] flex-1 ${TT_ME_SECURITY_L5.input}`}
          aria-label={t("me_security_page_aria_event_type")}
        />
        <select
          value={String(notifLimit)}
          onChange={(e) => setNotifLimit(Number(e.target.value) || 50)}
          className={TT_ME_SECURITY_L5.select}
          aria-label={t("me_security_page_aria_notif_limit")}
        >
          <option value="20">{t("me_security_page_notif_opt_20")}</option>
          <option value="50">{t("me_security_page_notif_opt_50")}</option>
          <option value="100">{t("me_security_page_notif_opt_100")}</option>
          <option value="200">{t("me_security_page_notif_opt_200")}</option>
        </select>
        <button
          type="button"
          onClick={() => void loadAll()}
          disabled={loading}
          className={TT_ME_SECURITY_L5.btnSecondary}
        >
          {t("me_security_page_notif_apply")}
        </button>
        <label className={TT_ME_SECURITY_L5.checkLabel}>
          <input
            type="checkbox"
            checked={riskOnlyFailed}
            onChange={(e) => setRiskOnlyFailed(e.target.checked)}
            className="accent-ref-sun"
          />
          {t("me_security_page_only_failed")}
        </label>
        <label className={TT_ME_SECURITY_L5.checkLabel}>
          <input
            type="checkbox"
            checked={riskOnlyPasswordRelated}
            onChange={(e) => setRiskOnlyPasswordRelated(e.target.checked)}
            className="accent-ref-sun"
          />
          {t("me_security_page_only_password")}
        </label>
      </div>

      <div className={TT_ME_SECURITY_L5.notifList}>
        {visibleNotifications.length === 0 ? (
          <p className="text-meta text-slate-400/90">{t("me_security_page_no_notifications")}</p>
        ) : (
          visibleNotifications.map((n: SecurityNotificationItem) => {
            const k = notificationKey(n);
            const expanded = Boolean(expandedNotificationIds[k]);
            const risk = isRiskNotification(n);
            return (
              <article
                key={k}
                data-tt-me-security-notif-row="1"
                className={`${TT_ME_SECURITY_L5.notifCard} ${risk ? TT_ME_SECURITY_L5.notifCardRisk : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100">{n.event_type ?? cellPh}</p>
                    <p className="mt-0.5 text-meta text-slate-400/95">
                      {n.template_key ?? cellPh} · {n.delivery_status ?? cellPh} · {formatTs(n.created_at)}
                    </p>
                    {n.last_error ? (
                      <p className="mt-1 text-meta text-danger/90">{n.last_error}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    data-tt-me-security-notif-expand="1"
                    onClick={() => toggleNotificationExpand(n)}
                    className={TT_ME_SECURITY_L5.btnSecondary}
                  >
                    {expanded ? t("me_security_page_collapse") : t("me_security_page_expand")}
                  </button>
                </div>
                {expanded ? (
                  <pre className={TT_ME_SECURITY_L5.notifPayload}>
                    {JSON.stringify(n.payload ?? {}, null, 2)}
                  </pre>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </MeSettingsL5Panel>
  );
}
