"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import {
  adminApiErrorUserText,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type PostRes = {
  status?: string;
  error?: string;
  item?: { version?: number; status?: string; request_ref?: string };
  current_version?: number;
};

const DSAR_STATUSES = ["", "open", "in_progress", "completed", "rejected", "cancelled"] as const;

const DSAR_STATUS_I18N: Record<Exclude<(typeof DSAR_STATUSES)[number], "">, string> = {
  open: "admin_compliance_update_status_open",
  in_progress: "admin_compliance_update_status_in_progress",
  completed: "admin_compliance_update_status_completed",
  rejected: "admin_compliance_update_status_rejected",
  cancelled: "admin_compliance_update_status_cancelled",
};

/** 500：DSAR 登记更新（super_admin + 乐观锁 + 幂等键）。 */
function AdminComplianceRequestUpdatePageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const complianceUpdateFilterHintId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminComplianceUpdateMetaBuild");
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = useMemo(() => {
    const raw = params?.requestId;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [expectedVersion, setExpectedVersion] = useState("");
  const [eventType, setEventType] = useState("");
  const [statusSel, setStatusSel] = useState("");
  const [notes, setNotes] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [writeOk, setWriteOk] = useState<string | null>(null);

  useEffect(() => {
    const v = searchParams.get("v");
    if (v != null && v.trim() !== "") setExpectedVersion(v.trim());
  }, [searchParams]);

  const submit = () => {
    setWriteError(null);
    setWriteOk(null);
    if (!requestId.trim()) {
      setWriteError(t("admin_compliance_update_missingId"));
      return;
    }
    const ev = Number.parseInt(expectedVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setWriteError(t("admin_compliance_update_badVersion"));
      return;
    }
    const et = eventType.trim();
    if (!et) {
      setWriteError(t("admin_compliance_update_eventRequired"));
      return;
    }

    setSubmitting(true);
    const body: Record<string, unknown> = {
      expected_version: ev,
      event_type: et,
    };
    if (statusSel.trim() !== "") body.status = statusSel.trim();
    if (notes.trim() !== "") body.notes = notes.trim();
    if (eventDetail.trim() !== "") body.event_detail = eventDetail.trim();

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setWriteError(t("admin_compliance_update_auth"));
      setSubmitting(false);
      return;
    }

    void adminFetchJson<PostRes>(
      "AdminComplianceRequestUpdatePage",
      apiUrl(routes.admin.complianceDataRequestUpdate(requestId)),
      { method: "POST", headers, body: JSON.stringify(body) }
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "compliance_data_request_version_conflict") {
          const cv = b.current_version;
          setWriteError(
            typeof cv === "number"
              ? t("admin_compliance_update_conflict").replace("{{current}}", String(cv))
              : t("admin_compliance_update_conflictGeneric")
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminComplianceRequestUpdatePage", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        const ver = b.item?.version;
        setWriteOk(
          typeof ver === "number"
            ? t("admin_compliance_update_ok").replace("{{version}}", String(ver))
            : t("admin_compliance_update_okGeneric")
        );
        if (typeof ver === "number") setExpectedVersion(String(ver));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminComplianceRequestUpdatePage", e);
        const msg = e instanceof Error ? e.message : "";
        setWriteError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_compliance_update_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_compliance_update_subtitle")}</p>
          {requestId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_compliance_events_requestId")}: {requestId}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          {requestId ? (
            <Link
              href={`/admin/compliance/requests/${encodeURIComponent(requestId)}/events`}
              className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_compliance_update_backEvents")}
            </Link>
          ) : null}
          <Link href="/admin/compliance/requests" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_compliance_events_backList")}
          </Link>
        </div>
      </header>

      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      {!requestId ? (
        <p className="mt-6 text-body text-danger" role="alert">
          {t("admin_compliance_update_missingId")}
        </p>
      ) : (
        <section
          className="mt-8 space-y-4 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5"
          aria-label={t("admin_compliance_update_form_aria")}
        >
          <p id={complianceUpdateFilterHintId} className="text-meta text-ink-600">
            {t("admin_compliance_update_filter_hint")}
          </p>

          <form
            className="space-y-4"
            aria-describedby={complianceUpdateFilterHintId}
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_expectedVersion")}
              <input
                name="expected_version"
                type="text"
                inputMode="numeric"
                value={expectedVersion}
                onChange={(e) => setExpectedVersion(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>

            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_eventType")}
              <input
                name="event_type"
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
                placeholder={t("admin_compliance_update_eventTypePh")}
              />
            </label>

            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_statusOptional")}
              <select
                name="status"
                value={statusSel}
                onChange={(e) => setStatusSel(e.target.value)}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {DSAR_STATUSES.map((s) => (
                  <option key={s || "omit"} value={s}>
                    {s === "" ? t("admin_compliance_update_statusOmit") : t(DSAR_STATUS_I18N[s])}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_notesOptional")}
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>

            <label className="block text-small text-ink-800">
              {t("admin_compliance_update_detailOptional")}
              <textarea
                name="event_detail"
                value={eventDetail}
                onChange={(e) => setEventDetail(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>

            {writeError && (
              <p className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
                {writeError}
              </p>
            )}
            {writeOk && (
              <p className="rounded-[var(--radius-md)] border border-success/25 bg-success/10 p-3 text-body text-success" role="status">
                {writeOk}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? true : undefined}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {submitting ? t("admin_compliance_update_submitting") : t("admin_compliance_update_submit")}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

export default function AdminComplianceRequestUpdatePage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_compliance_update_title">
      <AdminComplianceRequestUpdatePageInner />
    </AdminSearchParamsSuspense>
  );
}

