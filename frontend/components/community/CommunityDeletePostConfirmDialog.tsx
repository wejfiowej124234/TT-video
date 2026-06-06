"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Surface = "page" | "hub";

const DANGER_CONFIRM_BTN =
  "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-danger/55 bg-danger/10 px-4 py-2 text-small font-semibold text-red-300 hover:border-danger/70 hover:bg-danger/16 hover:text-red-200 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-50";

export function CommunityDeletePostConfirmDialog({
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

  return createPortal(
    <div
      className={TT_COMMUNITY_DRAWER_L5.postDetailOverlay}
      data-tt-community-delete-post-confirm="1"
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
          {t("community_delete_post")}
        </h2>
        <p id={descId} className="mt-2 text-meta text-slate-300 leading-snug">
          {t("community_delete_post_confirm")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={cancelClass} onClick={onCancel} disabled={busy}>
            {t("common_cancel")}
          </button>
          <button type="button" className={DANGER_CONFIRM_BTN} onClick={() => void onConfirm()} disabled={busy}>
            {busy ? t("common_loading") : t("community_delete_post")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
