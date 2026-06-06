"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  listTraveltrustNetworkAnnouncementsNewestFirst,
  type TravelTrustAnnouncement,
} from "@/lib/traveltrustNetworkAnnouncements";
import { TT_ANNOUNCEMENTS_MOTION_L5, TT_ANNOUNCEMENTS_PAGE_L5 } from "@/lib/traveltrust/l5";
import { TravelTrustAnnouncementDetailDialog } from "./TravelTrustAnnouncementDetailDialog";
import { TravelTrustAnnouncementsList } from "./TravelTrustAnnouncementsList";
import { TravelTrustAnnouncementsPageShell } from "./TravelTrustAnnouncementsPageShell";
import { TravelTrustSectionFilmDivider } from "./TravelTrustSectionFilmDivider";

/** `/traveltrust/announcements` — 项目动态全量归档 */
export function TravelTrustAnnouncementsPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<TravelTrustAnnouncement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const items = listTraveltrustNetworkAnnouncementsNewestFirst();

  const openDetail = useCallback((item: TravelTrustAnnouncement) => {
    setDetailItem(item);
    setDetailOpen(true);
    if (typeof window !== "undefined") {
      const next = `${window.location.pathname}${window.location.search}#${item.id}`;
      window.history.replaceState(null, "", next);
      setFocusId(item.id);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailItem(null);
    setFocusId(null);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    const syncHash = () => {
      const id = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      setFocusId(id || null);
      if (!id) return;
      const hit = listTraveltrustNetworkAnnouncementsNewestFirst().find((a) => a.id === id);
      if (hit) {
        setDetailItem(hit);
        setDetailOpen(true);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const headerMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: TT_ANNOUNCEMENTS_MOTION_L5.pageHeader.duration,
          ease: TT_ANNOUNCEMENTS_MOTION_L5.pageHeader.ease,
        },
      };

  return (
    <TravelTrustAnnouncementsPageShell>
      <main data-tt-traveltrust-announcements-page="1">
        <p className={TT_ANNOUNCEMENTS_PAGE_L5.backRowClass}>
          <Link href="/traveltrust" className={TT_ANNOUNCEMENTS_PAGE_L5.backLinkClass}>
            ← {t("traveltrust_announcements_back")}
          </Link>
        </p>
        <motion.header className={TT_ANNOUNCEMENTS_PAGE_L5.pageHeaderClass} {...headerMotion}>
          <p className={TT_ANNOUNCEMENTS_PAGE_L5.pageKickerClass}>{t("traveltrust_pulse_label")}</p>
          <h1 className={TT_ANNOUNCEMENTS_PAGE_L5.pageTitleClass}>{t("traveltrust_announcements_title")}</h1>
          <p className={TT_ANNOUNCEMENTS_PAGE_L5.pageSubtitleClass}>
            {t("traveltrust_pulse_dialog_desc").replace("{{n}}", String(items.length))}
          </p>
        </motion.header>
        <TravelTrustSectionFilmDivider />
        <div
          className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} mt-6 sm:mt-7`}
          data-tt-traveltrust-announcements-warm-plate-l5="1"
          data-tt-traveltrust-faq-warm-plate-l5="1"
        >
          <TravelTrustAnnouncementsList focusId={focusId} onViewDetail={openDetail} />
        </div>
        <TravelTrustAnnouncementDetailDialog item={detailItem} open={detailOpen} onClose={closeDetail} />
      </main>
    </TravelTrustAnnouncementsPageShell>
  );
}
