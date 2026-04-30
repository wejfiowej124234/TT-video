"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteMeSessionBySuffix,
  deleteMeSessionCurrent,
  getMeSecurityNotifications,
  getMeSessions,
} from "@/lib/apiClient";

type MeSessionItem = {
  session_token_suffix?: string;
  is_current?: boolean;
  created_at?: string;
  last_seen_at?: string | null;
  expires_at?: string | null;
  idle_expires_at?: string | null;
  revoked_at?: string | null;
  revoked_reason?: string | null;
};

type SecurityNotificationItem = {
  id?: string;
  event_type?: string;
  template_key?: string;
  delivery_status?: string;
  payload?: unknown;
  attempts?: number;
  last_error?: string | null;
  created_at?: string;
};

function formatTs(v?: string | null): string {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

export default function MeSecurityPage() {
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
  const [expandedNotificationIds, setExpandedNotificationIds] = useState<Record<string, boolean>>({});

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
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [notifEventType, notifLimit, notifStatus]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function revokeCurrent() {
    if (typeof window !== "undefined") {
      const ok = window.confirm("确认下线当前会话？操作后需要重新登录。");
      if (!ok) return;
    }
    setBusySuffix("current");
    setError(null);
    try {
      await deleteMeSessionCurrent();
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "当前会话下线失败");
    } finally {
      setBusySuffix(null);
    }
  }

  async function revokeBySuffix(suffix: string) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`确认下线会话 ${suffix} ？`);
      if (!ok) return;
    }
    setBusySuffix(suffix);
    setError(null);
    try {
      await deleteMeSessionBySuffix(suffix);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : `会话下线失败(${suffix})`);
    } finally {
      setBusySuffix(null);
    }
  }

  function isRiskNotification(n: SecurityNotificationItem): boolean {
    const eventType = (n.event_type ?? "").toLowerCase();
    const status = (n.delivery_status ?? "").toLowerCase();
    return (
      status === "failed" ||
      (n.attempts ?? 0) > 0 ||
      eventType.includes("reset") ||
      eventType.includes("forgot") ||
      eventType.includes("password")
    );
  }

  function isPasswordRelated(n: SecurityNotificationItem): boolean {
    const eventType = (n.event_type ?? "").toLowerCase();
    return (
      eventType.includes("reset") ||
      eventType.includes("forgot") ||
      eventType.includes("password")
    );
  }

  function notificationKey(n: SecurityNotificationItem): string {
    return n.id ?? `${n.event_type ?? "evt"}-${n.created_at ?? "na"}`;
  }

  function toggleNotificationExpand(n: SecurityNotificationItem) {
    const k = notificationKey(n);
    setExpandedNotificationIds((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  function exportNotificationsJson() {
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
      setError(e instanceof Error ? e.message : "导出失败");
    }
  }

  function exportSessionsJson() {
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
      setError(e instanceof Error ? e.message : "会话导出失败");
    }
  }

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

  return (
    <main className="min-h-screen bg-bg-main p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-h4 font-semibold text-ink-900">账号安全中心</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-3 py-2 text-small"
            >
              {loading ? "刷新中..." : "刷新"}
            </button>
            <Link href="/community/me" className="text-small text-travel-500 hover:underline">
              返回个人中心
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-3 py-2 text-small text-danger">
            {error}
          </div>
        ) : null}

        <section className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-small font-semibold text-ink-900">会话管理</h2>
            <button
              type="button"
              onClick={() => void revokeCurrent()}
              disabled={busySuffix === "current"}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-small"
            >
              {busySuffix === "current" ? "处理中..." : "下线当前会话"}
            </button>
            <button
              type="button"
              onClick={exportSessionsJson}
              disabled={sessions.length === 0}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-small"
            >
              导出会话 JSON
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small">
              <thead>
                <tr className="text-ink-500">
                  <th className="py-2 pr-3">后缀</th>
                  <th className="py-2 pr-3">当前</th>
                  <th className="py-2 pr-3">创建</th>
                  <th className="py-2 pr-3">最近活跃</th>
                  <th className="py-2 pr-3">状态</th>
                  <th className="py-2 pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((s) => {
                  const suffix = s.session_token_suffix ?? "";
                  const isBusy = busySuffix === suffix;
                  const isCurrent = Boolean(s.is_current);
                  return (
                    <tr key={`${suffix}-${s.created_at ?? ""}`} className="border-t border-ink-100">
                      <td className="py-2 pr-3 font-mono">{suffix || "-"}</td>
                      <td className="py-2 pr-3">{isCurrent ? "是（本设备）" : "否"}</td>
                      <td className="py-2 pr-3">{formatTs(s.created_at)}</td>
                      <td className="py-2 pr-3">{formatTs(s.last_seen_at)}</td>
                      <td className="py-2 pr-3">{s.revoked_at ? "revoked" : "active"}</td>
                      <td className="py-2 pr-3">
                        {suffix ? (
                          <button
                            type="button"
                            onClick={() => void revokeBySuffix(suffix)}
                            disabled={isBusy || isCurrent}
                            className="rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
                          >
                            {isCurrent ? "当前会话" : isBusy ? "处理中..." : "下线"}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-small font-semibold text-ink-900">安全通知</h2>
            <select
              value={notifStatus}
              onChange={(e) => setNotifStatus(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
              aria-label="通知状态筛选"
            >
              <option value="">全部状态</option>
              <option value="pending">pending</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
            </select>
            <input
              value={notifEventType}
              onChange={(e) => setNotifEventType(e.target.value)}
              placeholder="事件类型筛选（可选）"
              className="min-w-[200px] rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
              aria-label="事件类型筛选"
            />
            <select
              value={String(notifLimit)}
              onChange={(e) => setNotifLimit(Number(e.target.value) || 50)}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
              aria-label="通知数量限制"
            >
              <option value="20">20 条</option>
              <option value="50">50 条</option>
              <option value="100">100 条</option>
              <option value="200">200 条</option>
            </select>
            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
            >
              应用筛选
            </button>
            <button
              type="button"
              onClick={exportNotificationsJson}
              disabled={notifications.length === 0}
              className="rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
            >
              导出 JSON
            </button>
            <label className="inline-flex items-center gap-1 text-small text-ink-700">
              <input
                type="checkbox"
                checked={riskOnlyFailed}
                onChange={(e) => setRiskOnlyFailed(e.target.checked)}
              />
              仅失败
            </label>
            <label className="inline-flex items-center gap-1 text-small text-ink-700">
              <input
                type="checkbox"
                checked={riskOnlyPasswordRelated}
                onChange={(e) => setRiskOnlyPasswordRelated(e.target.checked)}
              />
              仅密码相关
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small">
              <thead>
                <tr className="text-ink-500">
                  <th className="py-2 pr-3">事件</th>
                  <th className="py-2 pr-3">模板</th>
                  <th className="py-2 pr-3">状态</th>
                  <th className="py-2 pr-3">尝试</th>
                  <th className="py-2 pr-3">错误</th>
                  <th className="py-2 pr-3">创建时间</th>
                  <th className="py-2 pr-3">明细</th>
                </tr>
              </thead>
              <tbody>
                {visibleNotifications.map((n) => {
                  const k = notificationKey(n);
                  const expanded = Boolean(expandedNotificationIds[k]);
                  return (
                    <Fragment key={k}>
                      <tr
                        className={`border-t border-ink-100 ${isRiskNotification(n) ? "bg-warning/10" : ""}`}
                      >
                        <td className="py-2 pr-3">{n.event_type ?? "-"}</td>
                        <td className="py-2 pr-3">{n.template_key ?? "-"}</td>
                        <td className="py-2 pr-3">{n.delivery_status ?? "-"}</td>
                        <td className="py-2 pr-3">{String(n.attempts ?? 0)}</td>
                        <td className="py-2 pr-3">{n.last_error ?? "-"}</td>
                        <td className="py-2 pr-3">{formatTs(n.created_at)}</td>
                        <td className="py-2 pr-3">
                          <button
                            type="button"
                            onClick={() => toggleNotificationExpand(n)}
                            className="rounded-[var(--radius-sm)] border border-ink-300 px-2 py-1 text-small"
                          >
                            {expanded ? "收起" : "展开"}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="border-t border-ink-100 bg-ink-50/70">
                          <td className="py-2 pr-3 font-medium text-ink-600" colSpan={7}>
                            <pre className="max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-ink-200 bg-bg-main p-2 text-[12px] leading-5 text-ink-700">
                              {JSON.stringify(n.payload ?? {}, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

