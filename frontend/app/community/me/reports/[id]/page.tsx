"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { getCommunityReport, postCommunityReportAppeal } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { isUuidString } from "@/lib/isUuidString";
import {
  communityReportReasonLabel,
  communityReportStatusLabel,
  communityReportTargetTypeLabel,
} from "@/lib/communityReportLabels";
import {
  communityCyanPillFocus,
  communityHeaderInlineFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";

type ReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason_code: string;
  details?: string | null;
  evidence_ref?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/** 160：举报人查看工单与结案后申诉（`GET/POST …/community/reports/:id`） */
function CommunityMeReportDetailPageInner() {
  const params = useParams();
  const rawId = typeof params.id === "string" ? params.id : "";
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appealBody, setAppealBody] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [appealFieldErr, setAppealFieldErr] = useState<string | null>(null);
  const [appealOk, setAppealOk] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!rawId.trim() || !isUuidString(rawId)) {
      setLoadError(t("community_report_ticket_invalid_id"));
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getCommunityReport(rawId);
      if (data?.status === "ok" && data.report) {
        setReport(data.report);
        setLoadError(null);
      } else {
        const { topMessage } = interpretCommunityWriteError(data, t, "community_report_ticket_load_failed");
        setReport(null);
        setLoadError(topMessage ?? t("community_report_ticket_load_failed"));
      }
    } catch (err) {
      setReport(null);
      setLoadError(mapApiReadError(err, t, "community_report_ticket_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [rawId, t]);

  useEffect(() => {
    if (!isLoggedIn || authPending) return;
    void fetchReport();
  }, [isLoggedIn, authPending, fetchReport]);

  const appealable = report && (report.status === "resolved" || report.status === "dismissed");

  const submitAppeal = async () => {
    if (!report || !appealable || appealBusy) return;
    setAppealError(null);
    setAppealFieldErr(null);
    setAppealBusy(true);
    try {
      const res = await postCommunityReportAppeal(report.id, appealBody);
      if (res?.status === "ok") {
        setAppealOk(true);
        setAppealBody("");
        return;
      }
      const { topMessage, fieldMessages } = interpretCommunityWriteError(
        res,
        t,
        "community_report_appeal_failed"
      );
      setAppealError(topMessage);
      setAppealFieldErr(fieldMessages.body ?? null);
    } catch (err) {
      setAppealError(mapApiReadError(err, t, "community_report_appeal_failed"));
    } finally {
      setAppealBusy(false);
    }
  };

  if (!isLoggedIn && !authPending) {
    return (
      <main
        className="max-w-lg mx-auto px-4 py-8 pb-24 safe-area-pb"
        aria-label={t("community_report_ticket_title")}
      >
        <h1 className="sr-only">{t("community_report_ticket_title")}</h1>
        <section
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-slate-900/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
          aria-label={t("community_report_ticket_login_required")}
        >
          <p className="text-body text-slate-200">{t("community_report_ticket_login_required")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(`/community/me/reports/${rawId}`)}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 safe-area-pb" aria-label={t("community_report_ticket_title")}>
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/community/me/reports"
          className={`${touchTargetLink44Classes} text-meta text-slate-300 hover:text-cyan-100 motion-sub ${communityHeaderInlineFocus}`}
        >
          {t("community_report_list_back")}
        </Link>
        <h1 className="text-h4 font-semibold text-cyan-200 flex-1 min-w-[12rem]">{t("community_report_ticket_title")}</h1>
      </header>

      {loading ? (
        <p className="text-meta text-slate-300" role="status">
          {t("common_loading")}
        </p>
      ) : loadError ? (
        <div className="space-y-3">
          <ApiErrorAlert message={loadError} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void fetchReport();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : report ? (
        <div className="space-y-4 rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 p-4">
          <div>
            <p className="text-meta text-slate-400">{t("community_report_ticket_id")}</p>
            <p className="text-small font-mono text-slate-200 break-all">{report.id}</p>
          </div>
          <div>
            <p className="text-meta text-slate-400">{t("community_report_ticket_status")}</p>
            <p className="text-small text-slate-200">{communityReportStatusLabel(t, report.status)}</p>
          </div>
          <div>
            <p className="text-meta text-slate-400">{t("community_report_ticket_target")}</p>
            <p className="text-small text-slate-200">
              {communityReportTargetTypeLabel(t, report.target_type)} ·{" "}
              <span className="font-mono break-all">{report.target_id}</span>
            </p>
          </div>
          <div>
            <p className="text-meta text-slate-400">{t("community_report_ticket_reason")}</p>
            <p className="text-small text-slate-200">{communityReportReasonLabel(t, report.reason_code)}</p>
          </div>
          {report.details ? (
            <div>
              <p className="text-meta text-slate-400">{t("community_report_ticket_your_note")}</p>
              <p className="text-small text-slate-300 whitespace-pre-wrap">{report.details}</p>
            </div>
          ) : null}

          {appealable ? (
            <div className="border-t border-slate-600/50 pt-4 space-y-3">
              <h2 className="text-body font-medium text-slate-200">{t("community_report_appeal_heading")}</h2>
              {appealOk ? (
                <p className="text-meta text-success/95">{t("community_report_appeal_success")}</p>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void submitAppeal();
                  }}
                >
                  <textarea
                    value={appealBody}
                    onChange={(e) => setAppealBody(e.target.value)}
                    rows={5}
                    maxLength={4000}
                    placeholder={t("community_report_appeal_placeholder")}
                    className="w-full rounded-[var(--radius-md)] border border-slate-600 bg-slate-800/80 px-3 py-2 text-small text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    aria-invalid={!!appealFieldErr}
                  />
                  {appealFieldErr ? <p className="text-meta text-danger/95">{appealFieldErr}</p> : null}
                  {appealError ? <ApiErrorAlert message={appealError} /> : null}
                  <button
                    type="submit"
                    disabled={appealBusy || !appealBody.trim()}
                    aria-busy={appealBusy ? true : undefined}
                    className={`rounded-full border border-warning/50 bg-warning/20 px-5 py-2.5 text-meta font-medium text-warning/95 motion-sub disabled:opacity-50 min-h-[44px] inline-flex items-center justify-center ${communityWarningPillFocus}`}
                  >
                    {appealBusy ? t("common_loading") : t("community_report_appeal_submit")}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

export default function CommunityMeReportDetailPage() {
  return (
    <CommunityParamRouteSuspense
      mainAriaLabelKey="community_report_ticket_title"
      horizontalPadding="px-4"
    >
      <CommunityMeReportDetailPageInner />
    </CommunityParamRouteSuspense>
  );
}
