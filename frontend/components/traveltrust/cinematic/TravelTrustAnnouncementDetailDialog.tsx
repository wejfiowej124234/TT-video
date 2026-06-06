"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { TravelTrustAnnouncement } from "@/lib/traveltrustNetworkAnnouncements";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TT_ANNOUNCEMENTS_MOTION_L5,
  TT_PULSE_KIND_L5,
  TT_PULSE_UPDATES_PANEL_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

const KIND_STYLE = TT_PULSE_KIND_L5;
const SM_MQL = "(min-width: 640px)";

function subscribeSmUp(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(SM_MQL);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSmUpSnapshot() {
  if (typeof window === "undefined") return true;
  return window.matchMedia(SM_MQL).matches;
}

function getSmUpServerSnapshot() {
  return true;
}

function detailMessageKey(item: TravelTrustAnnouncement): string {
  return `${item.messageKey}_detail`;
}

type Props = {
  item: TravelTrustAnnouncement | null;
  open: boolean;
  onClose: () => void;
};

/** 单条公告详情 — 弹层内读完全文，右下角关闭 */
export function TravelTrustAnnouncementDetailDialog({ item, open, onClose }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();
  const trapRef = useFocusTrap(open, onClose);
  const reduceMotion = useReducedMotion();
  const smUp = useSyncExternalStore(subscribeSmUp, getSmUpSnapshot, getSmUpServerSnapshot);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !item) return;
    trackTravelTrustEvent("traveltrust_announcement_detail_open", { id: item.id });
  }, [open, item]);

  if (typeof document === "undefined") return null;

  const panelMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : smUp
      ? {
          initial: { opacity: 0, scale: TT_ANNOUNCEMENTS_MOTION_L5.panelScale },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.98 },
          transition: {
            duration: TT_ANNOUNCEMENTS_MOTION_L5.panel.duration,
            ease: TT_ANNOUNCEMENTS_MOTION_L5.panel.ease,
          },
        }
      : {
          initial: { opacity: 0, y: TT_ANNOUNCEMENTS_MOTION_L5.panelSheetOffsetY },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 24 },
          transition: {
            duration: TT_ANNOUNCEMENTS_MOTION_L5.panel.duration,
            ease: TT_ANNOUNCEMENTS_MOTION_L5.panel.ease,
          },
        };

  return createPortal(
    <AnimatePresence>
      {open && item ? (
        <div
          className={TT_PULSE_UPDATES_PANEL_L5.detailOverlayClass}
          data-tt-traveltrust-announcement-detail-dialog="1"
          data-tt-traveltrust-announcement-detail-dialog-l5="1"
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
            data-tt-traveltrust-announcement-detail-panel="1"
            {...panelMotion}
          >
            <div className={TT_PULSE_UPDATES_PANEL_L5.detailPanelTopGlowClass} aria-hidden />
            {!reduceMotion ? (
              <motion.div
                className={TT_PULSE_UPDATES_PANEL_L5.detailShimmerClass}
                aria-hidden
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                transition={{
                  duration: TT_ANNOUNCEMENTS_MOTION_L5.detailShimmerDuration,
                  ease: "easeOut",
                }}
              />
            ) : null}
            <div className={TT_PULSE_UPDATES_PANEL_L5.sheetHandleClass} aria-hidden />
            <div className={TT_PULSE_UPDATES_PANEL_L5.headerClass}>
              <div className="min-w-0 pr-2">
                <p className={`${TT_PULSE_UPDATES_PANEL_L5.rowKindClass} ${KIND_STYLE[item.kind]}`}>
                  {t(`traveltrust_pulse_kind_${item.kind}`)}
                </p>
                <h2 id={titleId} className={TT_PULSE_UPDATES_PANEL_L5.detailTitleClass}>
                  {t(item.messageKey)}
                </h2>
                <time className={`mt-2 block ${TT_PULSE_UPDATES_PANEL_L5.rowDateClass}`} dateTime={item.at}>
                  {item.at}
                </time>
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
            <div className={TT_PULSE_UPDATES_PANEL_L5.listClass}>
              <p id={bodyId} className={TT_PULSE_UPDATES_PANEL_L5.detailBodyClass}>
                {t(detailMessageKey(item)) !== detailMessageKey(item)
                  ? t(detailMessageKey(item))
                  : t(item.messageKey)}
              </p>
            </div>
            <div className={TT_PULSE_UPDATES_PANEL_L5.detailFooterClass}>
              <button type="button" className={TT_PULSE_UPDATES_PANEL_L5.detailPrimaryCtaClass} onClick={onClose}>
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
