"use client";

import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

type ToastSlice = Pick<
  CommunityFeedMainPortalsProps,
  "t" | "toast" | "toastBodyOverride" | "toastHint" | "reportSuccessId"
>;

export function CommunityFeedMainToastPortal(props: ToastSlice) {
  const { t, toast, toastBodyOverride, toastHint, reportSuccessId } = props;
  if (!toast) return null;
  return (
    <div
      className="fixed left-1/2 z-50 w-[min(100vw-1.5rem,22rem)] -translate-x-1/2 rounded-[var(--radius-md)] border border-ref-sun/30 bg-ink-900/95 backdrop-blur px-4 py-3 text-small text-ref-sun shadow-scifi-toast motion-sub animate-in fade-in duration-200 safe-area-toast-bottom"
      role="status"
      aria-live="polite"
    >
      <p className="text-center font-medium">{toastBodyOverride ?? t(toast)}</p>
      {toast === "community_publish_success" && toastHint ? (
        <div className="mt-2 flex flex-col items-center gap-2 border-t border-ref-sun/18 pt-2">
          <p className="text-meta text-center text-slate-300">{t(toastHint)}</p>
          <Link
            href="/community/me/posts"
            className={`${touchTargetLink44Classes} text-meta font-medium text-ref-sun/90 underline underline-offset-2 hover:text-ref-sun/95 motion-sub ${communityCardLinkFocus}`}
          >
            {t("community_publish_view_my_posts")}
          </Link>
        </div>
      ) : null}
      {toast === "community_report_submitted" && reportSuccessId ? (
        <div className="mt-2 flex flex-col items-center gap-2 border-t border-ref-sun/18 pt-2">
          <p className="text-meta text-center text-slate-400">{t("community_report_submitted_hint")}</p>
          <Link
            href={`/community/me/reports/${encodeURIComponent(reportSuccessId)}`}
            className={`${touchTargetLink44Classes} text-meta font-medium text-ref-sun/90 underline underline-offset-2 hover:text-ref-sun/95 motion-sub ${communityCardLinkFocus}`}
          >
            {t("community_report_view_ticket")}
          </Link>
          <Link
            href="/community/me/reports"
            className={`${touchTargetLink44Classes} text-meta font-medium text-slate-300 underline underline-offset-2 hover:text-ref-sun/95 motion-sub ${communityCardLinkFocus}`}
          >
            {t("community_report_view_all_reports")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
