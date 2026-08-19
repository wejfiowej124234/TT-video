"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  TT_ANNOUNCEMENTS_MOTION_L5,
  TT_PULSE_UPDATES_PANEL_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Decorative placeholder only — not a store URL, not a scannable download. */
function AppComingSoonQrPlaceholder({ badge }: { badge: string }) {
  const cells = [
    1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1,
    0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1,
    1,
  ];

  return (
    <div
      className="relative mx-auto aspect-square w-[min(100%,13.5rem)] rounded-2xl border border-ref-sun/18 bg-[#f6ead4] p-3"
      data-tt-traveltrust-app-qr-placeholder="1"
      aria-hidden
    >
      <svg viewBox="0 0 13 13" className="h-full w-full" role="presentation">
        {cells.map((on, i) => {
          const x = i % 13;
          const y = Math.floor(i / 13);
          const finder =
            (x < 3 && y < 3) || (x > 9 && y < 3) || (x < 3 && y > 9) || (x >= 5 && x <= 7 && y >= 5 && y <= 7);
          if (finder) return null;
          if (!on) return null;
          return <rect key={i} x={x} y={y} width={1} height={1} fill="#1c140c" />;
        })}
        <rect x={0} y={0} width={3} height={3} fill="#1c140c" />
        <rect x={10} y={0} width={3} height={3} fill="#1c140c" />
        <rect x={0} y={10} width={3} height={3} fill="#1c140c" />
        <rect x={5} y={5} width={3} height={3} fill="#1c140c" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center bg-[#f6ead4]/42">
        <span className="rounded-full border border-[#1c140c]/35 bg-[#f6ead4] px-3 py-1 text-[13px] font-semibold tracking-wide text-[#1c140c]">
          {badge}
        </span>
      </div>
    </div>
  );
}

export function TravelTrustAppDownloadDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();
  const trapRef = useFocusTrap(open, onClose);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const panelMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: TT_ANNOUNCEMENTS_MOTION_L5.panelScale },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
        transition: {
          duration: TT_ANNOUNCEMENTS_MOTION_L5.panel.duration,
          ease: TT_ANNOUNCEMENTS_MOTION_L5.panel.ease,
        },
      };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={TT_PULSE_UPDATES_PANEL_L5.detailOverlayClass}
          data-tt-traveltrust-app-download-dialog="1"
          data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        >
          <motion.button
            type="button"
            className={TT_PULSE_UPDATES_PANEL_L5.backdropClass}
            aria-label={t("common_close")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: TT_ANNOUNCEMENTS_MOTION_L5.backdrop.duration,
              ease: TT_ANNOUNCEMENTS_MOTION_L5.backdrop.ease,
            }}
          />
          <motion.div
            ref={(el) => {
              trapRef.current = el;
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className={TT_PULSE_UPDATES_PANEL_L5.detailPanelClass}
            data-tt-traveltrust-app-download-panel="1"
            {...panelMotion}
          >
            <div className={TT_PULSE_UPDATES_PANEL_L5.detailPanelTopGlowClass} aria-hidden />
            <div className={TT_PULSE_UPDATES_PANEL_L5.sheetHandleClass} aria-hidden />
            <div className={TT_PULSE_UPDATES_PANEL_L5.headerClass}>
              <div className="min-w-0 pr-2">
                <p className={TT_PULSE_UPDATES_PANEL_L5.titleClass}>
                  {t("traveltrust_app_download_kicker")}
                </p>
                <h2 id={titleId} className={TT_PULSE_UPDATES_PANEL_L5.detailTitleClass}>
                  {t("traveltrust_app_download_title")}
                </h2>
              </div>
              <button
                type="button"
                className={TT_PULSE_UPDATES_PANEL_L5.closeBtnClass}
                onClick={onClose}
                aria-label={t("common_close")}
              >
                <span aria-hidden>×</span>
              </button>
            </div>

            <div className={TT_PULSE_UPDATES_PANEL_L5.detailContentClass}>
              <AppComingSoonQrPlaceholder badge={t("traveltrust_app_download_qr_badge")} />
              <p className="mt-3 text-center text-meta text-slate-400">{t("traveltrust_app_download_qr_caption")}</p>
              <p id={bodyId} className={`${TT_PULSE_UPDATES_PANEL_L5.detailBodyClass} mt-4`}>
                {t("traveltrust_app_download_body")}
              </p>
              <p className="mt-3 text-meta leading-relaxed text-slate-400">
                {t("traveltrust_app_download_store_note")}
              </p>
            </div>

            <div className={TT_PULSE_UPDATES_PANEL_L5.detailFooterClass}>
              <button type="button" className={TT_PULSE_UPDATES_PANEL_L5.detailSecondaryCtaClass} onClick={onClose}>
                {t("common_close")}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
