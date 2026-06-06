"use client";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  communityCyanPillFocus,
  communityPublishFabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

export function CommunityFeedbackPageHeader({
  t,
  onOpenPost,
  clearFeedbackFormErrors,
}: {
  t: (key: string) => string;
  onOpenPost: () => void;
  clearFeedbackFormErrors: () => void;
}) {
  return (
    <header className={`${TT_COMMUNITY_PAGE_L5.pageHeader} sm:px-6 sm:py-5 mb-6`}>
      <h1 className={TT_COMMUNITY_PAGE_L5.pageTitleH2}>
        {t("community_feedback_title")}
      </h1>
      <p className="text-small text-slate-300 mt-1">{t("community_feedback_subtitle")}</p>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            clearFeedbackFormErrors();
            onOpenPost();
          }}
        >
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center ${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
            aria-label={t("community_feedback_post")}
          >
            <span aria-hidden>+</span>
            {t("community_feedback_post")}
          </button>
        </form>
        <Link
          href="/community"
          className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/60 bg-ink-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-ink-700/60 motion-sub ${communitySlatePillFocus}`}
        >
          {t("community_back_to_community")}
        </Link>
      </div>
    </header>
  );
}
