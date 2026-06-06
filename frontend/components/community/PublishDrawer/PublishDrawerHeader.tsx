"use client";

import type { FormEvent, RefObject } from "react";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerHeaderProps = {
  t: LocaleTranslateFn;
  drawerTitleId: string;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function PublishDrawerHeader({ t, drawerTitleId, backButtonRef, onClose }: PublishDrawerHeaderProps) {
  return (
    <header className={`flex shrink-0 items-center justify-between ${TT_COMMUNITY_DRAWER_L5.sheetHeader} py-3 min-h-[52px] px-4 sm:px-5`}>
      <form
        className="inline"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button
          ref={backButtonRef}
          type="submit"
          className={`${TT_COMMUNITY_DRAWER_L5.publishSaveDraftBtn} ${communitySlatePillFocus}`}
          aria-label={t("community_back_to_community")}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">{t("community_back_to_community")}</span>
        </button>
      </form>
      <h2 id={drawerTitleId} className="text-body font-semibold text-ref-sun absolute left-1/2 -translate-x-1/2 pointer-events-none">
        {t("community_publish_title")}
      </h2>
      <form
        className="inline shrink-0"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button
          type="submit"
          className={`${TT_COMMUNITY_DRAWER_L5.publishCloseBtn} ${communitySlatePillFocus}`}
          aria-label={t("community_close")}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </form>
    </header>
  );
}
