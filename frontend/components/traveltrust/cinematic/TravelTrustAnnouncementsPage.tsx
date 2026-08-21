"use client";
import "./TravelTrustAnnouncementSurfaceGlow.css";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  filterAnnouncementsByChip,
  useTraveltrustAnnouncementsPageData,
  type AnnouncementLaneFilter,
} from "@/lib/hooks/useTraveltrustCmsAnnouncements";
import type { TravelTrustAnnouncementDisplay } from "@/lib/traveltrustCmsAnnouncements";
import {
  listTraveltrustAnnouncementsByLane,
  resolveTraveltrustPulseAnnouncementId,
} from "@/lib/traveltrustNetworkAnnouncements";
import { TT_ANNOUNCEMENTS_MOTION_L5, TT_ANNOUNCEMENTS_PAGE_L5 } from "@/lib/traveltrust/l5";
import { TravelTrustAnnouncementDetailDialog } from "./TravelTrustAnnouncementDetailDialog";
import { TravelTrustAnnouncementsList } from "./TravelTrustAnnouncementsList";
import { TravelTrustAnnouncementsPageShell } from "./TravelTrustAnnouncementsPageShell";
import { TravelTrustRoadmapTimeline } from "./TravelTrustRoadmapTimeline";
import { TravelTrustSectionFilmDivider } from "./TravelTrustSectionFilmDivider";
import { TravelTrustProtocolDirectoryPanel } from "./TravelTrustProtocolDirectoryPanel";
import { OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS } from "@/lib/traveltrustOfficialAnnouncementChipOverlay";

const FILTER_CHIPS: AnnouncementLaneFilter[] = [...OFFICIAL_WWW_ANNOUNCEMENT_FILTER_CHIPS];

function findAnnouncementById(
  id: string,
  pools: TravelTrustAnnouncementDisplay[][],
): TravelTrustAnnouncementDisplay | undefined {
  const resolved = resolveTraveltrustPulseAnnouncementId(id);
  return pools.flat().find((a) => a.id === resolved);
}

/** `/traveltrust/announcements` — pin 列表版式 + live 第五枚「活动」chip overlay */
export function TravelTrustAnnouncementsPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<TravelTrustAnnouncementDisplay | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [laneFilter, setLaneFilter] = useState<AnnouncementLaneFilter>("all");

  const { loading, source, allItems } = useTraveltrustAnnouncementsPageData();

  const staticFallbackPools = useMemo(
    () => [
      listTraveltrustAnnouncementsByLane("product"),
      listTraveltrustAnnouncementsByLane("governance"),
      listTraveltrustAnnouncementsByLane("protocol_status"),
    ],
    [],
  );

  const visibleItems = useMemo(
    () => filterAnnouncementsByChip(allItems, laneFilter),
    [allItems, laneFilter],
  );

  const openDetail = useCallback((item: TravelTrustAnnouncementDisplay) => {
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
      const rawId = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const id = rawId ? resolveTraveltrustPulseAnnouncementId(rawId) : "";
      setFocusId(id || null);
      if (!id) return;
      const hit = findAnnouncementById(id, [allItems, ...staticFallbackPools]);
      if (hit) {
        setDetailItem(hit);
        setDetailOpen(true);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [allItems, staticFallbackPools]);

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
      <main data-tt-traveltrust-announcements-page="1" data-tt-traveltrust-announcements-cms={source}>
        <p className={TT_ANNOUNCEMENTS_PAGE_L5.backRowClass}>
          <Link href="/traveltrust" className={TT_ANNOUNCEMENTS_PAGE_L5.backLinkClass}>
            ← {t("traveltrust_announcements_back")}
          </Link>
        </p>
        <motion.header className={TT_ANNOUNCEMENTS_PAGE_L5.pageHeaderClass} {...headerMotion}>
          <p className={TT_ANNOUNCEMENTS_PAGE_L5.pageKickerClass}>{t("traveltrust_announcements_page_kicker")}</p>
          <h1 className={TT_ANNOUNCEMENTS_PAGE_L5.pageTitleClass}>{t("traveltrust_announcements_title")}</h1>
          <p className={TT_ANNOUNCEMENTS_PAGE_L5.pageSubtitleClass}>
            {t("traveltrust_announcements_page_subtitle")}
          </p>
        </motion.header>

        <div
          className={TT_ANNOUNCEMENTS_PAGE_L5.filterRowClass}
          role="group"
          aria-label={t("traveltrust_announcements_filter_label")}
        >
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={laneFilter === chip}
              className={`${TT_ANNOUNCEMENTS_PAGE_L5.filterChipBaseClass} ${
                laneFilter === chip
                  ? TT_ANNOUNCEMENTS_PAGE_L5.filterChipActiveClass
                  : TT_ANNOUNCEMENTS_PAGE_L5.filterChipIdleClass
              }`}
              onClick={() => setLaneFilter(chip)}
            >
              {t(`traveltrust_announcements_filter_${chip}`)}
            </button>
          ))}
        </div>

        {laneFilter === "protocol_status" ? (
          <>
            <p className={TT_ANNOUNCEMENTS_PAGE_L5.laneNoteClass} data-tt-traveltrust-protocol-disclaimer="1">
              {t("traveltrust_announcements_protocol_section_disclaimer")}
            </p>
            <TravelTrustProtocolDirectoryPanel />
          </>
        ) : null}

        {laneFilter !== "protocol_status" ? (
          <div
            className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} mt-4 sm:mt-5`}
            data-tt-traveltrust-announcements-warm-plate-l5="1"
            data-tt-traveltrust-announcements-list-plate="1"
          >
            {loading ? (
              <p className="px-4 py-6 text-meta text-slate-400">{t("traveltrust_announcements_loading")}</p>
            ) : visibleItems.length === 0 ? (
              <p className="px-4 py-6 text-meta text-slate-400">{t("traveltrust_announcements_empty")}</p>
            ) : (
              <TravelTrustAnnouncementsList
                items={visibleItems}
                focusId={focusId}
                onViewDetail={openDetail}
              />
            )}
          </div>
        ) : (
          <div
            className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} mt-4 sm:mt-5`}
            data-tt-traveltrust-announcements-warm-plate-l5="1"
            data-tt-traveltrust-announcements-protocol-cards="1"
          >
            {loading ? (
              <p className="px-4 py-6 text-meta text-slate-400">{t("traveltrust_announcements_loading")}</p>
            ) : visibleItems.length === 0 ? (
              <p className="px-4 py-6 text-meta text-slate-400">{t("traveltrust_announcements_empty")}</p>
            ) : (
              <TravelTrustAnnouncementsList
                items={visibleItems}
                focusId={focusId}
                onViewDetail={openDetail}
              />
            )}
          </div>
        )}

        {laneFilter === "all" ? (
          <>
            <TravelTrustSectionFilmDivider />
            <TravelTrustRoadmapTimeline />
          </>
        ) : null}

        <TravelTrustAnnouncementDetailDialog item={detailItem} open={detailOpen} onClose={closeDetail} />
      </main>
    </TravelTrustAnnouncementsPageShell>
  );
}
