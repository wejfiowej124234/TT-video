"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminErrorUserText,
  adminFetchErrorKind,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import {
  getAdminDriftSummary,
  normalizeAdminDriftSummaryRead,
  type NormalizedAdminDriftSummary,
} from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function formatUnknownJson(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    const s = JSON.stringify(value, null, 2);
    return s ?? String(value);
  } catch {
    return String(value);
  }
}

function formatDriftDetected(
  v: boolean | undefined,
  notProvidedLabel: string,
): string {
  if (v === undefined) return notProvidedLabel;
  return v ? "true" : "false";
}

/** Epic C-04：漂移摘要只读页（C-02 归一化）；不提供修复动作。 */
export default function AdminDriftSummaryPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const noticeId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [model, setModel] = useState<NormalizedAdminDriftSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminDriftSummary()
      .then((raw) => setModel(normalizeAdminDriftSummaryRead(raw)))
      .catch((e: unknown) => {
        logAdminFetch("AdminDriftSummaryPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full flex-1">
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_drift_summary_title")}
          </h1>
          <div
            id={noticeId}
            className="mt-3 rounded-[var(--radius-lg)] border border-amber-200/80 bg-amber-50/90 p-4 text-body text-ink-800"
            role="note"
            data-testid="admin-audit-read-only-scope"
          >
            {t("admin_audit_tools_read_only_scope")}
          </div>
          <p className="mt-3 text-body text-ink-600">{t("admin_drift_summary_subtitle")}</p>
        </div>
        <Link
          href="/admin"
          className={`${touchTargetLink44Classes} shrink-0 text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_schema_back")}
        </Link>
      </header>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-body text-ink-600">{t("admin_drift_summary_loading")}</p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : model ? (
          <section
            className="rounded-[var(--radius-lg)] border border-ink-200 bg-bg-console p-4"
            aria-labelledby={pageTitleId}
          >
            {model.status ? (
              <p className="mb-3 font-mono text-meta text-ink-600">
                {t("admin_drift_summary_status_label")}:{" "}
                <span className="text-ink-900">{model.status}</span>
              </p>
            ) : null}
            <p className="text-meta text-ink-600">
              <span className="font-mono text-ink-700">{t("admin_drift_summary_drift_detected_label")}</span>
              {": "}
              <span
                className="font-mono text-ink-900"
                data-testid="admin-drift-summary-drift-detected"
              >
                {formatDriftDetected(model.drift_detected, t("admin_drift_summary_drift_detected_not_provided"))}
              </span>
            </p>
            <p className="mt-3 text-meta font-medium text-ink-600">{t("admin_drift_summary_delta_label")}</p>
            {/* delta：整段 JSON 只读展示（含数组元素原样序列化）；不做字段级 diff、不高亮对比。 */}
            <pre
              className="mt-1 max-h-[min(28rem,55vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100"
              data-testid="admin-drift-summary-delta"
            >
              {formatUnknownJson(model.delta)}
            </pre>
          </section>
        ) : null}
      </div>
    </main>
  );
}
