"use client";

import Link from "next/link";
import { useId, type FormEvent } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { communityCyanPillFocus, communitySlatePillFocus } from "@/lib/communityA11yFocus";

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 safe-area-inset-t safe-area-inset-b"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-modal="true"
    >
      <div ref={trapRef} className="w-full max-w-sm rounded-[var(--radius-xl)] border border-cyan-500/40 bg-slate-900/95 shadow-scifi-login overflow-hidden">
        <div className="relative flex items-center justify-between border-b border-cyan-500/30 px-4 py-3 min-h-[48px]">
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
              className={`flex min-h-[44px] items-center justify-start gap-2 rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 px-3 py-2 text-meta text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub ${communitySlatePillFocus}`}
              aria-label={t("community_back_drawer")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <span>{t("community_back_drawer")}</span>
            </button>
          </form>
          <h2 id={titleId} className="absolute left-1/2 -translate-x-1/2 text-body font-semibold text-cyan-200 pointer-events-none">{t("community_login_to_publish")}</h2>
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
                className={`flex flex-1 min-h-[44px] min-w-0 items-center justify-center rounded-[var(--radius-xl)] border border-slate-500/60 bg-slate-800/80 px-4 py-2.5 text-meta text-slate-300 motion-sub hover:bg-slate-700/80 ${communitySlatePillFocus}`}
              >
                {t("common_cancel")}
              </button>
            </form>
            <Link
              href="/auth/login?returnUrl=/community"
              className={`flex-1 rounded-[var(--radius-xl)] border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub text-center min-h-[44px] flex items-center justify-center ${communityCyanPillFocus}`}
            >
              {t("header_login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
