"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  formatTraveltrustAnnouncementListDate,
  isTraveltrustPulseDeployAnnouncement,
  resolveTraveltrustAnnouncementRowCtaLabelKey,
  traveltrustAnnouncementListLabelKey,
  traveltrustContentTierLabelKey,
  type TravelTrustAnnouncement,
  type TravelTrustAnnouncementKind,
  type TravelTrustContentTier,
} from "@/lib/traveltrustNetworkAnnouncements";
import { traveltrustAnnouncementLaneLabelKey } from "@/lib/traveltrustAnnouncementCatalog";
import {
  traveltrustAnnouncementListText,
  traveltrustAnnouncementTitleText,
  type TravelTrustAnnouncementDisplay,
} from "@/lib/traveltrustCmsAnnouncements";
import {
  TT_ANNOUNCEMENTS_LIST_L5,
  TT_ANNOUNCEMENTS_MOTION_L5,
  TT_PULSE_KIND_L5,
  TT_PULSE_UPDATES_PANEL_L5,
  TT_ROADMAP_L5,
} from "@/lib/traveltrust/l5";

const KIND_STYLE = TT_PULSE_KIND_L5;

function pulseKindStyleClass(kind: TravelTrustAnnouncementKind): string {
  return KIND_STYLE[kind];
}

function tierBadgeClass(tier: TravelTrustContentTier): string {
  switch (tier) {
    case "live":
      return TT_ROADMAP_L5.tierLiveClass;
    case "upcoming":
      return TT_ROADMAP_L5.tierUpcomingClass;
    default:
      return TT_ROADMAP_L5.tierRoadmapClass;
  }
}

function AnnouncementRow({
  item,
  highlight,
  onViewDetail,
  index,
  showListDates,
  showKindBadge,
}: {
  item: TravelTrustAnnouncementDisplay;
  highlight?: boolean;
  onViewDetail: (item: TravelTrustAnnouncementDisplay) => void;
  index: number;
  showListDates: boolean;
  showKindBadge: boolean;
}) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const deployPulse = isTraveltrustPulseDeployAnnouncement(item.id);
  const kindLabel = t(`traveltrust_pulse_kind_${item.kind}`);
  const isCms = Boolean(item.cmsCopy);
  const chipLabel = isCms
    ? t(traveltrustAnnouncementLaneLabelKey(item.lane))
    : t(traveltrustAnnouncementListLabelKey(item));
  const showKindChip = showKindBadge && !deployPulse && kindLabel !== chipLabel;
  const headline = isCms ? traveltrustAnnouncementTitleText(item, locale) : null;
  const bodyText = isCms
    ? traveltrustAnnouncementListText(item, locale)
    : t(item.messageKey);
  const rowCtaLabel = t(resolveTraveltrustAnnouncementRowCtaLabelKey(item));
  const formattedDate =
    item.cmsCopy && item.contentTier === "upcoming" && item.releaseAt
      ? formatTraveltrustAnnouncementListDate(item.releaseAt, locale ?? "en")
      : showListDates && item.contentTier === "live" && item.effectiveAt
        ? formatTraveltrustAnnouncementListDate(item.effectiveAt, locale ?? "en")
        : null;
  const rowStateClass = highlight ? TT_ANNOUNCEMENTS_LIST_L5.rowHighlightClass : TT_ANNOUNCEMENTS_LIST_L5.rowIdleClass;

  return (
    <motion.li
      id={item.id}
      className={`${TT_ANNOUNCEMENTS_LIST_L5.itemShellClass} scroll-mt-28`}
      data-tt-traveltrust-announcement-row={item.id}
      data-tt-traveltrust-announcement-lane={item.lane}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: TT_ANNOUNCEMENTS_MOTION_L5.listItem.duration,
        ease: TT_ANNOUNCEMENTS_MOTION_L5.listItem.ease,
        delay: index * TT_ANNOUNCEMENTS_MOTION_L5.listStagger,
      }}
    >
      <motion.div
        className={`${TT_ANNOUNCEMENTS_LIST_L5.rowInnerClass} ${rowStateClass}`}
        whileHover={reduceMotion ? undefined : TT_ANNOUNCEMENTS_LIST_L5.rowHover}
        whileTap={reduceMotion ? undefined : TT_ANNOUNCEMENTS_LIST_L5.rowTap}
      >
        <div className={TT_ANNOUNCEMENTS_LIST_L5.tagRowClass}>
          <span className={TT_ANNOUNCEMENTS_LIST_L5.phaseChipClass}>{chipLabel}</span>
          {showKindChip ? (
            <span className={`${TT_PULSE_UPDATES_PANEL_L5.rowKindClass} ${pulseKindStyleClass(item.kind)}`}>{kindLabel}</span>
          ) : null}
          <span className={`${TT_ROADMAP_L5.statusBadgeClass} ${tierBadgeClass(item.contentTier)}`}>
            {t(traveltrustContentTierLabelKey(item.contentTier))}
          </span>
        </div>
        {headline ? <p className={TT_ANNOUNCEMENTS_LIST_L5.rowTitleClass}>{headline}</p> : null}
        {bodyText ? (
          <p className={`${TT_PULSE_UPDATES_PANEL_L5.rowBodyClass}${headline ? " mt-1.5 text-slate-300/88" : ""}`}>
            {bodyText}
          </p>
        ) : null}
        <div className={TT_PULSE_UPDATES_PANEL_L5.rowMetaClass}>
          <span className={TT_PULSE_UPDATES_PANEL_L5.rowDateClass}>
            {formattedDate ? (
              <time dateTime={item.releaseAt ?? item.effectiveAt} className={TT_ANNOUNCEMENTS_LIST_L5.dateChipClass}>
                {formattedDate}
              </time>
            ) : null}
          </span>
          <button
            type="button"
            className={TT_PULSE_UPDATES_PANEL_L5.rowCtaClass}
            onClick={() => onViewDetail(item)}
            aria-haspopup="dialog"
          >
            {rowCtaLabel}
            <span className="text-ref-sun/50" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </motion.div>
    </motion.li>
  );
}

type Props = {
  items: TravelTrustAnnouncementDisplay[];
  focusId?: string | null;
  onViewDetail: (item: TravelTrustAnnouncementDisplay) => void;
  showListDates?: boolean;
  showKindBadge?: boolean;
};

/** 公告列表（按 lane 分轨传入 items） */
export function TravelTrustAnnouncementsList({
  items,
  focusId,
  onViewDetail,
  showListDates = false,
  showKindBadge = false,
}: Props) {
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!focusId || scrolledRef.current || typeof document === "undefined") return;
    const el = document.getElementById(focusId);
    if (!el) return;
    scrolledRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId]);

  return (
    <motion.ul
      className={TT_ANNOUNCEMENTS_LIST_L5.innerListClass}
      role="list"
      data-tt-traveltrust-announcements-list="1"
      data-tt-traveltrust-announcements-list-l5="1"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: TT_ANNOUNCEMENTS_MOTION_L5.listStagger } },
      }}
    >
      {items.map((item, index) => (
        <AnnouncementRow
          key={item.id}
          item={item}
          index={index}
          highlight={focusId === item.id}
          onViewDetail={onViewDetail}
          showListDates={showListDates}
          showKindBadge={showKindBadge}
        />
      ))}
    </motion.ul>
  );
}
