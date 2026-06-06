"use client";

import Link from "next/link";
import { useId, type FormEvent } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export interface CommunityLoginModalProps {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
  backButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

/** 未登录时点击发布触发的登录引导弹窗（45 a11y：焦点 trap + Esc 关闭） */
export default function CommunityLoginModal({ open, onClose, t, backButtonRef }: CommunityLoginModalProps) {
  const titleId = useId();
  const descId = useId();
  const trapRef = useFocusTrap(open, onClose);
  if (!open) return null;
  return (
    <div
      data-tt-community-login-for-publish="1"
      className={TT_COMMUNITY_FEED_ACTION.loginModalScrim}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-modal="true"
    >
      <div ref={trapRef} className={TT_COMMUNITY_FEED_ACTION.loginModalSheet}>
        <div className={`relative flex items-center justify-between border-b border-ref-sun/18 px-4 py-3 min-h-[48px] ${TT_COMMUNITY_DRAWER_L5.sheetHeader}`}>
          <form
            className="contents z-10"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              ref={backButtonRef as React.RefObject<HTMLButtonElement> | undefined}
              type="submit"
              className={`${TT_COMMUNITY_DRAWER_L5.postDetailGhostBtn} ${communitySlatePillFocus}`}
              aria-label={t("community_back_drawer")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <span>{t("community_back_drawer")}</span>
            </button>
          </form>
          <h2 id={titleId} className="absolute left-1/2 -translate-x-1/2 text-body font-semibold text-ref-sun pointer-events-none">{t("community_login_to_publish")}</h2>
          <div className="w-20 shrink-0" aria-hidden />
        </div>
        <div className="p-5">
          <p id={descId} className="text-small text-slate-300 mb-5">{t("community_login_modal_hint")}</p>
          <div className="flex gap-3">
            <form
              className="contents"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onClose();
              }}
            >
              <button
                type="submit"
                className={`flex flex-1 min-h-[44px] min-w-0 items-center justify-center rounded-[var(--radius-xl)] ${TT_COMMUNITY_FEED_ACTION.asideGhostPill} ${communitySlatePillFocus}`}
              >
                {t("common_cancel")}
              </button>
            </form>
            <Link
              href="/auth/login?returnUrl=/community"
              className={`flex-1 ${TT_COMMUNITY_PAGE_L5.pill} text-center ${communityCyanPillFocus}`}
            >
              {t("header_login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
