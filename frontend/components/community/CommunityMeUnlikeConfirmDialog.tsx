"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Surface = "page" | "hub";

export function CommunityMeUnlikeConfirmDialog({
  open,
  busy,
  t,
  surface = "page",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  t: (k: string) => string;
  surface?: Surface;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const trapRef = useFocusTrap(open, onCancel);

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

  const confirmClass =
    surface === "hub"
      ? `inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 py-2 text-meta font-medium text-fuchsia-100 hover:bg-fuchsia-500/25 motion-sub ${communityFuchsiaPillFocus}`
      : `${TT_COMMUNITY_PAGE_L5.pill} flex-1 justify-center ${communityFuchsiaPillFocus}`;

  return createPortal(
    <div
      className={TT_COMMUNITY_DRAWER_L5.postDetailOverlay}
      data-tt-community-unlike-confirm="1"
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
          {t("community_me_unlike_title")}
        </h2>
        <p id={descId} className="mt-2 text-meta text-slate-300 leading-snug">
          {t("community_me_unlike_confirm")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={cancelClass} onClick={onCancel} disabled={busy}>
            {t("common_cancel")}
          </button>
          <button type="button" className={confirmClass} onClick={() => void onConfirm()} disabled={busy}>
            {busy ? t("community_me_notes_menu_remove_like_pending") : t("community_me_notes_menu_remove_like")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
