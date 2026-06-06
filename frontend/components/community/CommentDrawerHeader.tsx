"use client";

import type { FormEvent, RefObject } from "react";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export interface CommentDrawerHeaderProps {
  t: (key: string) => string;
  count: number;
  drawerTitleId: string;
  drawerDescId: string;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function CommentDrawerHeader({
  t,
  count,
  drawerTitleId,
  drawerDescId,
  backButtonRef,
  onClose,
}: CommentDrawerHeaderProps) {
  return (
    <>
      <div className={`flex shrink-0 items-center justify-between px-4 py-3 safe-area-inset-t min-h-[48px] ${TT_COMMUNITY_DRAWER_L5.sheetHeader} bg-ink-900/95`}>
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
            className={`${TT_COMMUNITY_DRAWER_L5.postDetailGhostBtn} ${communitySlatePillFocus}`}
            aria-label={t("community_back_drawer")}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t("community_back_drawer")}</span>
          </button>
        </form>
        <h2 id={drawerTitleId} className="text-body font-semibold text-ref-sun truncate min-w-0 flex-1 text-center px-2">
          {t("community_comments")} · {count}
        </h2>
        <div className="w-20 shrink-0" aria-hidden />
      </div>
      <p id={drawerDescId} className="sr-only">
        {t("community_subtitle")}
      </p>
    </>
  );
}
