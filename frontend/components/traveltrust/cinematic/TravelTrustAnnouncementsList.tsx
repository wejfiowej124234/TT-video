"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  listTraveltrustNetworkAnnouncementsNewestFirst,
  type TravelTrustAnnouncement,
} from "@/lib/traveltrustNetworkAnnouncements";
import {
  TT_ANNOUNCEMENTS_LIST_L5,
  TT_ANNOUNCEMENTS_MOTION_L5,
  TT_PULSE_KIND_L5,
  TT_PULSE_UPDATES_PANEL_L5,
} from "@/lib/traveltrust/l5";

const KIND_STYLE = TT_PULSE_KIND_L5;

function AnnouncementRow({
  item,
  highlight,
  onViewDetail,
  index,
}: {
  item: TravelTrustAnnouncement;
  highlight?: boolean;
  onViewDetail: (item: TravelTrustAnnouncement) => void;
  index: number;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const kindLabel = t(`traveltrust_pulse_kind_${item.kind}`);
  const bodyText = t(item.messageKey);
  const rowStateClass = highlight ? TT_ANNOUNCEMENTS_LIST_L5.rowHighlightClass : TT_ANNOUNCEMENTS_LIST_L5.rowIdleClass;

  return (
    <motion.li
      id={item.id}
      className={`${TT_ANNOUNCEMENTS_LIST_L5.itemShellClass} scroll-mt-28`}
      data-tt-traveltrust-announcement-row={item.id}
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
        <span className={`${TT_PULSE_UPDATES_PANEL_L5.rowKindClass} ${KIND_STYLE[item.kind]}`}>{kindLabel}</span>
        <p className={TT_PULSE_UPDATES_PANEL_L5.rowBodyClass}>{bodyText}</p>
        <div className={TT_PULSE_UPDATES_PANEL_L5.rowMetaClass}>
          <time className={TT_PULSE_UPDATES_PANEL_L5.rowDateClass} dateTime={item.at}>
            {item.at}
          </time>
          <button
            type="button"
            className={TT_PULSE_UPDATES_PANEL_L5.rowCtaClass}
            onClick={() => onViewDetail(item)}
            aria-haspopup="dialog"
          >
            {t("traveltrust_pulse_view_detail")}
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
  focusId?: string | null;
  onViewDetail: (item: TravelTrustAnnouncement) => void;
};

/** 公告时间线列表（最新在上） */
export function TravelTrustAnnouncementsList({ focusId, onViewDetail }: Props) {
  const items = listTraveltrustNetworkAnnouncementsNewestFirst();
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
        />
      ))}
    </motion.ul>
  );
}
