"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
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
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { deriveListDataState } from "@/lib/dataState";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { CommunityParamRouteSuspense } from "@/components/community/CommunityParamRouteSuspense";

/** 88 §3.2：我的举报列表空态 — 与消息/好友页结构化空态同口径 */
function MeReportsEmptyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-5 py-10 text-center space-y-4"
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
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none inline-flex items-center justify-center min-h-[44px] ${communityCyanPillFocus}`}
        >
          {t("community_tab_feed")}
        </Link>
        <Link
          href="/community/explore"
          className={`rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 py-2 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub motion-reduce:transition-none inline-flex items-center justify-center min-h-[44px] ${communityFuchsiaPillFocus}`}
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
function CommunityMeReportsListPageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reportsLoginReturnUrl = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "posts"),
    [pathname, searchParams],
  );
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

  const reportsListState = useMemo(
    () => deriveListDataState({ loading, error: loadError, items }),
    [loading, loadError, items]
  );

  if (authPending) {
    return (
      <main
        className="max-w-lg mx-auto px-4 py-6 pb-24 safe-area-pb"
        aria-busy="true"
        aria-label={t("community_me_my_reports")}
      >
        <div className="mb-6 h-9 w-40 max-w-[55%] rounded-[var(--radius-sm)] bg-ink-600/40 animate-pulse motion-reduce:animate-none" />
        <div className="mb-4 h-4 w-full max-w-md rounded bg-ink-600/30 animate-pulse motion-reduce:animate-none" />
        <div className="min-h-[12rem] rounded-[var(--radius-md)] border border-cyan-400/20 bg-ink-800/50 backdrop-blur-md animate-pulse motion-reduce:animate-none" />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 pb-24 safe-area-pb" aria-label={t("community_me_my_reports")}>
        <section
          data-tt-community-me-surface="community_me_reports_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
          aria-label={t("community_me_my_reports")}
        >
          <p className="text-body text-slate-200">{t("community_report_ticket_login_required")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(reportsLoginReturnUrl)}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none ${communityCyanPillFocus}`}
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
          className={`${touchTargetLink44Classes} text-meta text-slate-300 hover:text-cyan-100 motion-sub motion-reduce:transition-none ${communityHeaderInlineFocus}`}
        >
          {t("community_back")}
        </Link>
        <h1 className="text-h4 font-semibold text-cyan-200 flex-1">{t("community_me_my_reports")}</h1>
      </header>

      <p className="text-meta text-slate-400 mb-4">{t("community_report_list_hint")}</p>

      <CommunityMeDataStateSurface
        state={reportsListState}
        t={t}
        analyticsSurface="community_me_reports_list"
        onRetry={() => void load()}
        loadingSlot={
          <ul
            className="m-0 list-none space-y-3 p-0"
            aria-busy="true"
            aria-label={t("community_me_my_reports")}
          >
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="min-h-[5.5rem] rounded-[var(--radius-md)] border border-cyan-400/15 bg-ink-700/40 animate-pulse motion-reduce:animate-none"
              />
            ))}
          </ul>
        }
        emptySlot={<MeReportsEmptyPanel t={t} />}
        success={(rows) => (
          <ul className="space-y-3" role="list">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/community/me/reports/${encodeURIComponent(row.id)}`}
                  className={`flex w-full min-h-[44px] flex-col justify-center rounded-[var(--radius-md)] border border-slate-600/60 bg-ink-800/70 p-4 hover:border-cyan-500/40 motion-sub motion-reduce:transition-none ${communityCardLinkFocus}`}
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
                    <span className="text-meta text-cyan-300 shrink-0">
                      {t("community_report_view_ticket")}
                      {t("ui_link_nav_arrow_suffix")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      />
    </main>
  );
}

export default function CommunityMeReportsListPage() {
  return (
    <CommunityParamRouteSuspense mainAriaLabelKey="community_me_my_reports" horizontalPadding="px-4">
      <CommunityMeReportsListPageInner />
    </CommunityParamRouteSuspense>
  );
}
