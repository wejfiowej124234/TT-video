"use client";

import type { FormEvent, RefObject } from "react";
import Link from "next/link";
import CommunityLoginModal from "@/components/community/CommunityLoginModal";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

export interface CommunityFeedMainPageChromeProps {
  t: (key: string) => string;
  showLoginModal: boolean;
  setShowLoginModal: (open: boolean) => void;
  loginBackButtonRef: RefObject<HTMLButtonElement | null>;
  onSubmitPublishFab: (e: FormEvent<HTMLFormElement>) => void;
}

export default function CommunityFeedMainPageChrome({
  t,
  showLoginModal,
  setShowLoginModal,
  loginBackButtonRef,
  onSubmitPublishFab,
}: CommunityFeedMainPageChromeProps) {
  return (
    <>
      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-end w-full">
          <Link
            href="/"
            className={`pointer-events-auto inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-600 bg-ink-800/90 backdrop-blur px-4 py-2 text-meta text-slate-300 hover:bg-ink-700/90 motion-sub ${communitySlatePillFocus}`}
          >
            {t("community_back")}
          </Link>
        </div>
      </footer>

      <div className="fixed right-4 bottom-24 z-20 sm:right-8 sm:bottom-24 md:hidden">
        <form className="contents" onSubmit={onSubmitPublishFab}>
          <button
            type="submit"
            data-testid="community-feed-publish-fab"
            className={`${TT_COMMUNITY_FEED_ACTION.publishFab} ${TT_COMMUNITY_FEED_ACTION.publishFabFocus}`}
            aria-label={t("community_publish")}
          >
            + {t("community_publish")}
          </button>
        </form>
      </div>

      <CommunityLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        t={t}
        backButtonRef={loginBackButtonRef}
      />

      <div className="relative z-10 pt-6 pb-8 text-center">
        <p className="text-meta text-slate-400">{t("community_more_coming")}</p>
      </div>
    </>
  );
}
