"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Surface = "page" | "hub";
type ConfirmVariant = "post" | "comment";

const DANGER_CONFIRM_BTN =
  "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-danger/55 bg-danger/10 px-4 py-2 text-small font-semibold text-red-300 hover:border-danger/70 hover:bg-danger/16 hover:text-red-200 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_COPY: Record<ConfirmVariant, { title: string; body: string; confirm: string }> = {
  post: {
    title: "community_delete_post",
    body: "community_delete_post_confirm",
    confirm: "community_delete_post",
  },
  comment: {
    title: "community_delete_comment",
    body: "community_delete_comment_confirm",
    confirm: "community_delete_comment",
  },
};

export function CommunityDeletePostConfirmDialog({
  open,
  busy,
  t,
  surface = "page",
  variant = "post",
  error = null,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  t: (k: string) => string;
  surface?: Surface;
  variant?: ConfirmVariant;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const trapRef = useFocusTrap(open, onCancel);
  const copy = VARIANT_COPY[variant];

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!portalReady || !open || typeof document === "undefined") return null;

  const panelClass =
    surface === "hub"
      ? "relative w-full max-w-md rounded-[var(--radius-lg)] border border-cyan-500/35 bg-ink-900/95 shadow-scifi-panel ring-1 ring-white/5 p-5 sm:p-6"
      : `${TT_COMMUNITY_DRAWER_L5.sheet} relative w-full max-w-md p-5 sm:p-6`;

  const cancelClass =
    surface === "hub"
      ? `inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-cyan-400/45 bg-cyan-500/12 px-4 py-2 text-meta font-medium text-cyan-100 hover:bg-cyan-500/22 motion-sub ${communityCyanPillFocus}`
      : `${TT_COMMUNITY_PAGE_L5.pill} flex-1 justify-center ${communityCyanPillFocus}`;

  return createPortal(
    <div
      className={TT_COMMUNITY_DRAWER_L5.postDetailOverlay}
      data-tt-community-delete-post-confirm={variant === "post" ? "1" : undefined}
      data-tt-community-delete-comment-confirm={variant === "comment" ? "1" : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={panelClass}
        tabIndex={-1}
      >
        <h2 id={titleId} className="text-body font-semibold text-slate-100">
          {t(copy.title)}
        </h2>
        <p id={descId} className="mt-2 text-meta text-slate-300 leading-snug">
          {t(copy.body)}
        </p>
        {error ? (
          <p className="mt-3 text-meta text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={cancelClass} onClick={onCancel} disabled={busy}>
            {t("common_cancel")}
          </button>
          <button type="button" className={DANGER_CONFIRM_BTN} onClick={() => void onConfirm()} disabled={busy}>
            {busy ? t("common_loading") : t(copy.confirm)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
