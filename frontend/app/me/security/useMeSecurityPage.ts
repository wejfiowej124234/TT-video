"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useMeSettingsL5Confirm } from "@/hooks/useMeSettingsL5Confirm";
import { meSettingsHubHref } from "@/lib/me/meSettingsHubFlash";
import {
  deleteMeSessionBySuffix,
  deleteMeSessionCurrent,
  getMeSecurityNotifications,
  getMeSessions,
} from "@/lib/apiClient";
import type { MeSessionItem, SecurityNotificationItem } from "./meSecurityPageTypes";
import { isPasswordRelated, notificationKey } from "./meSecurityPageNotify";

export function useMeSecurityPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const mainTitleId = useId();
  const confirm = useMeSettingsL5Confirm();
  const [sessions, setSessions] = useState<MeSessionItem[]>([]);
  const [notifications, setNotifications] = useState<SecurityNotificationItem[]>([]);
  const [notifStatus, setNotifStatus] = useState("");
  const [notifEventType, setNotifEventType] = useState("");
  const [notifLimit, setNotifLimit] = useState(50);
  const [riskOnlyFailed, setRiskOnlyFailed] = useState(false);
  const [riskOnlyPasswordRelated, setRiskOnlyPasswordRelated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busySuffix, setBusySuffix] = useState<string | null>(null);
  const [expandedNotificationIds, setExpandedNotificationIds] = useState<Record<string, boolean>>(
    {},
  );

  const cellPh = t("me_security_page_cell_placeholder");

  const formatTs = useCallback(
    (v?: string | null): string => {
      if (!v) return cellPh;
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return v;
      return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    },
    [cellPh],
  );

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.revoked_at),
    [sessions],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessRaw, notifRaw] = await Promise.all([
        getMeSessions(),
        getMeSecurityNotifications({
          limit: notifLimit,
          status: notifStatus || undefined,
          event_type: notifEventType || undefined,
        }),
      ]);
      const sessItems = (sessRaw as { items?: unknown[] })?.items ?? [];
      const notifItems = (notifRaw as { items?: unknown[] })?.items ?? [];
      setSessions(sessItems as MeSessionItem[]);
      setNotifications(notifItems as SecurityNotificationItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("me_security_page_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [notifEventType, notifLimit, notifStatus, t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const performRevokeCurrent = useCallback(async () => {
    setBusySuffix("current");
    setError(null);
    try {
      await deleteMeSessionCurrent();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("me_security_page_revoke_current_failed"));
    } finally {
      setBusySuffix(null);
    }
  }, [loadAll, t]);

  const performRevokeBySuffix = useCallback(
    async (suffix: string) => {
      setBusySuffix(suffix);
      setError(null);
      try {
        await deleteMeSessionBySuffix(suffix);
        await loadAll();
        router.push(meSettingsHubHref("sessions"));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : t("me_security_page_revoke_suffix_failed", { suffix }),
        );
      } finally {
        setBusySuffix(null);
      }
    },
    [loadAll, router, t],
  );

  const revokeCurrent = useCallback(() => {
    confirm.request({
      titleKey: "me_security_page_revoke_current_title",
      descKey: "me_security_page_revoke_current_confirm",
      danger: true,
      confirmLabelKey: "me_security_page_revoke_confirm_action",
      onConfirm: performRevokeCurrent,
    });
  }, [confirm, performRevokeCurrent]);

  const revokeBySuffix = useCallback(
    (suffix: string) => {
      confirm.request({
        titleKey: "me_security_page_revoke_suffix_title",
        descKey: "me_security_page_revoke_suffix_confirm",
        descVars: { suffix },
        danger: true,
        confirmLabelKey: "me_security_page_revoke_confirm_action",
        onConfirm: () => performRevokeBySuffix(suffix),
      });
    },
    [confirm, performRevokeBySuffix],
  );

  const toggleNotificationExpand = useCallback((n: SecurityNotificationItem) => {
    const k = notificationKey(n);
    setExpandedNotificationIds((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const exportNotificationsJson = useCallback(() => {
    try {
      const payload = {
        exported_at: new Date().toISOString(),
        applied_filters: {
          status: notifStatus || null,
          event_type: notifEventType || null,
          limit: notifLimit,
        },
        items: notifications,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeStatus = notifStatus || "all";
      const safeEvent = (notifEventType || "all").replace(/[^a-zA-Z0-9_-]+/g, "_");
      a.href = url;
      a.download = `me-security-notifications-${safeStatus}-${safeEvent}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("me_security_page_export_notif_failed"));
    }
  }, [notifEventType, notifLimit, notifStatus, notifications, t]);

  const exportSessionsJson = useCallback(() => {
    try {
      const payload = {
        exported_at: new Date().toISOString(),
        items: sessions,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "me-security-sessions.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("me_security_page_export_sessions_failed"));
    }
  }, [sessions, t]);

  const visibleNotifications = useMemo(() => {
    let rows = notifications;
    if (riskOnlyFailed) {
      rows = rows.filter((n) => (n.delivery_status ?? "").toLowerCase() === "failed");
    }
    if (riskOnlyPasswordRelated) {
      rows = rows.filter((n) => isPasswordRelated(n));
    }
    return rows;
  }, [notifications, riskOnlyFailed, riskOnlyPasswordRelated]);

  return {
    t,
    confirm,
    mainTitleId,
    loading,
    error,
    cellPh,
    formatTs,
    activeSessions,
    exportSessionsDisabled: sessions.length === 0,
    exportNotificationsDisabled: notifications.length === 0,
    busySuffix,
    revokeCurrent,
    revokeBySuffix,
    loadAll,
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
    exportSessionsJson,
    exportNotificationsJson,
    visibleNotifications,
    expandedNotificationIds,
    toggleNotificationExpand,
  };
}

export type MeSecurityPageViewModel = ReturnType<typeof useMeSecurityPage>;
