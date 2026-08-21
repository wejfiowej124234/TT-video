"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { TravelTrustAnnouncement } from "@/lib/traveltrustNetworkAnnouncements";
import {
  traveltrustAnnouncementListText,
  traveltrustAnnouncementTitleText,
  type TravelTrustAnnouncementDisplay,
} from "@/lib/traveltrustCmsAnnouncements";
import {
  traveltrustAnnouncementCtaHref,
  resolveTraveltrustAnnouncementModalCtaLabelKey,
  traveltrustContentTierLabelKey,
} from "@/lib/traveltrustNetworkAnnouncements";
import { traveltrustAnnouncementSurfaceChipKey } from "@/lib/traveltrustAnnouncementCatalog";
import { traveltrustSafeAnnouncementHref } from "@/lib/traveltrustSafeHref";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TT_ANNOUNCEMENTS_LIST_L5,
  TT_ANNOUNCEMENTS_MOTION_L5,
  TT_PULSE_KIND_L5,
  TT_PULSE_UPDATES_PANEL_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { TravelTrustAnnouncementDetailBodyV2 } from "./TravelTrustAnnouncementDetailBodyV2";

const KIND_STYLE = TT_PULSE_KIND_L5;
const SM_MQL = "(min-width: 640px)";

function tierInlineClass(tier: TravelTrustAnnouncement["contentTier"]): string {
  switch (tier) {
    case "live":
      return "text-emerald-200/90";
    case "upcoming":
      return "text-ref-sun/85";
    default:
      return "text-slate-400/95";
  }
}

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

type Props = {
  item: TravelTrustAnnouncementDisplay | null;
  open: boolean;
  onClose: () => void;
};

/** 单条公告详情 — L5 · 六块 · 一屏无内滚 */
export function TravelTrustAnnouncementDetailDialog({ item, open, onClose }: Props) {
  const { t, locale } = useTranslation();
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

  const ctaHrefRaw = item ? traveltrustAnnouncementCtaHref(item) : undefined;
  const ctaHref = traveltrustSafeAnnouncementHref(ctaHrefRaw);
  const ctaLabel = item ? t(resolveTraveltrustAnnouncementModalCtaLabelKey(item)) : null;

  return createPortal(
    <AnimatePresence>
      {open && item ? (
        <div
          className={TT_PULSE_UPDATES_PANEL_L5.detailOverlayClass}
          data-tt-traveltrust-announcement-detail-dialog="1"
          data-tt-traveltrust-announcement-detail-dialog-l5="1"
          data-tt-traveltrust-announcement-detail-v2="1"
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
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span className={TT_ANNOUNCEMENTS_LIST_L5.phaseChipClass}>
                    {t(traveltrustAnnouncementSurfaceChipKey(item))}
                  </span>
                  <span className="font-mono text-kicker text-ref-sun/35" aria-hidden>
                    ·
                  </span>
                  <span
                    className={`${TT_PULSE_UPDATES_PANEL_L5.rowKindClass} ${tierInlineClass(item.contentTier)}`}
                  >
                    {t(traveltrustContentTierLabelKey(item.contentTier))}
                  </span>
                </p>
                <h2 id={titleId} className={TT_PULSE_UPDATES_PANEL_L5.detailTitleClass}>
                  {item.cmsCopy
                    ? (traveltrustAnnouncementTitleText(item, locale) ?? t(item.messageKey))
                    : t(item.messageKey)}
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

            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
              <TravelTrustAnnouncementDetailBodyV2 item={item} bodyId={bodyId} />
            </div>

            <div className={TT_PULSE_UPDATES_PANEL_L5.detailFooterClass}>
              <button type="button" className={TT_PULSE_UPDATES_PANEL_L5.detailSecondaryCtaClass} onClick={onClose}>
                {t("common_close")}
              </button>
              {ctaHref && ctaLabel ? (
                <Link
                  href={ctaHref}
                  className={TT_PULSE_UPDATES_PANEL_L5.detailPrimaryCtaClass}
                  onClick={() => {
                    trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                      source: "announcement_detail",
                      target: ctaHref,
                      id: item.id,
                    });
                    onClose();
                  }}
                >
                  {ctaLabel}
                </Link>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
