"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { getMyCommunityReports } from "@/lib/apiClient/community";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import {
  communityReportReasonLabel,
  communityReportStatusLabel,
  communityReportTargetTypeLabel,
} from "@/lib/communityReportLabels";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communityHeaderInlineFocus,
} from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 88 §3.2：我的举报列表空态 — 与消息/好友页结构化空态同口径 */
function MeReportsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-slate-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_report_list_empty")}
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-300"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-body text-slate-200">{t("community_report_list_empty")}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_report_list_empty_hint")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <Link
          href="/community"
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_tab_feed")}
        </Link>
        <Link
          href="/community/explore"
          className={`rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 py-2 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub inline-flex items-center justify-center min-h-[44px] ${communityFuchsiaPillFocus}`}
        >
          {t("community_explore_title")}
        </Link>
      </div>
    </div>
  );
}

type ReportListItem = {
  id: string;
  target_type: string;
  target_id: string;
  reason_code: string;
  status: string;
  created_at: string;
};

/** 160：举报人工单列表（`GET …/community/me/reports`） */
export default function CommunityMeReportsListPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getMyCommunityReports({ limit: 50 });
      if (data?.status === "ok" && Array.isArray(data.items)) {
        setItems(data.items);
        setLoadError(null);
      } else {
        const { topMessage } = interpretCommunityWriteError(data, t, "community_report_list_load_failed");
        setItems([]);
        setLoadError(topMessage ?? t("community_report_list_load_failed"));
      }
    } catch (err) {
      setItems([]);
      setLoadError(mapApiReadError(err, t, "community_report_list_load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isLoggedIn || authPending) return;
    void load();
  }, [isLoggedIn, authPending, load]);

  if (!isLoggedIn && !authPending) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 pb-24 safe-area-pb" aria-label={t("community_me_my_reports")}>
        <section
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-slate-900/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
          aria-label={t("community_me_my_reports")}
        >
          <p className="text-body text-slate-200">{t("community_report_ticket_login_required")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent("/community/me/reports")}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 safe-area-pb" aria-label={t("community_me_my_reports")}>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/community/me"
          className={`${touchTargetLink44Classes} text-meta text-slate-300 hover:text-cyan-100 motion-sub ${communityHeaderInlineFocus}`}
        >
          {t("community_back")}
        </Link>
        <h1 className="text-h4 font-semibold text-cyan-200 flex-1">{t("community_me_my_reports")}</h1>
      </header>

      <p className="text-meta text-slate-400 mb-4">{t("community_report_list_hint")}</p>

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
              void load();
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
      ) : items.length === 0 ? (
        <MeReportsEmptyPanel t={t} />
      ) : (
        <ul className="space-y-3" role="list">
          {items.map((row) => (
            <li key={row.id}>
              <Link
                href={`/community/me/reports/${encodeURIComponent(row.id)}`}
                className={`flex w-full min-h-[44px] flex-col justify-center rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-900/70 p-4 hover:border-cyan-500/40 motion-sub ${communityCardLinkFocus}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-small font-medium text-slate-200 truncate">
                      {communityReportStatusLabel(t, row.status)}
                    </p>
                    <p className="text-meta text-slate-400 mt-1">
                      {communityReportReasonLabel(t, row.reason_code)}
                    </p>
                    <p className="text-meta text-slate-400 mt-1">
                      {communityReportTargetTypeLabel(t, row.target_type)} ·{" "}
                      <span className="font-mono text-slate-300 break-all">{row.target_id}</span>
                    </p>
                    <p className="text-meta text-slate-400 mt-1">
                      {t("community_report_list_submitted_at")}{" "}
                      <time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString()}</time>
                    </p>
                  </div>
                  <span className="text-meta text-cyan-300 shrink-0">{t("community_report_view_ticket")} →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
