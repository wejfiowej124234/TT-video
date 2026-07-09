"use client";



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

  TRAVELTRUST_ANNOUNCEMENTS_PROTOCOL_SECTION_ID,

  TRAVELTRUST_ANNOUNCEMENTS_TTG_SECTION_ID,

} from "@/lib/traveltrustNetworkAnnouncements";

import { TT_ANNOUNCEMENTS_MOTION_L5, TT_ANNOUNCEMENTS_PAGE_L5 } from "@/lib/traveltrust/l5";

import { TravelTrustAnnouncementDetailDialog } from "./TravelTrustAnnouncementDetailDialog";

import { TravelTrustAnnouncementsList } from "./TravelTrustAnnouncementsList";

import { TravelTrustAnnouncementsPageShell } from "./TravelTrustAnnouncementsPageShell";

import { TravelTrustRoadmapTimeline } from "./TravelTrustRoadmapTimeline";

import { TravelTrustSectionFilmDivider } from "./TravelTrustSectionFilmDivider";

import { TravelTrustTtgRoundPanel } from "./TravelTrustTtgRoundPanel";



const FILTER_CHIPS: AnnouncementLaneFilter[] = ["all", "product", "governance", "protocol_status"];



function findAnnouncementById(

  id: string,

  pools: TravelTrustAnnouncementDisplay[][],

): TravelTrustAnnouncementDisplay | undefined {

  const resolved = resolveTraveltrustPulseAnnouncementId(id);

  return pools.flat().find((a) => a.id === resolved);

}



/** `/traveltrust/announcements` — 产品 / TTG·治理 / 协议 / 路线图 分轨（互不混排主列表） */

export function TravelTrustAnnouncementsPage() {

  const { t } = useTranslation();

  const reduceMotion = useReducedMotion();

  const [focusId, setFocusId] = useState<string | null>(null);

  const [detailItem, setDetailItem] = useState<TravelTrustAnnouncementDisplay | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [laneFilter, setLaneFilter] = useState<AnnouncementLaneFilter>("all");



  const { loading, source, productItems, governanceItems, protocolItems, allItems } =

    useTraveltrustAnnouncementsPageData();



  const staticFallbackPools = useMemo(

    () => [

      listTraveltrustAnnouncementsByLane("product"),

      listTraveltrustAnnouncementsByLane("governance"),

      listTraveltrustAnnouncementsByLane("protocol_status"),

    ],

    [],

  );



  const visibleItems = useMemo(() => {

    const filtered = filterAnnouncementsByChip(allItems, laneFilter);

    if (laneFilter === "all") {

      return filtered.filter((i) => i.lane === "product");

    }

    if (laneFilter === "governance") {

      return filtered.filter((i) => i.lane === "governance");

    }

    if (laneFilter === "protocol_status") {

      return filtered.filter((i) => i.lane === "protocol_status");

    }

    return filtered.filter((i) => i.lane === "product");

  }, [allItems, laneFilter]);



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



  const showMainPlate = laneFilter !== "all" || productItems.length > 0;

  const showTtg = laneFilter === "all" || laneFilter === "governance";

  const showProtocolSection = laneFilter === "all" || laneFilter === "protocol_status";

  const showRoadmap = laneFilter === "all";

  const showProtocolDisclaimer = laneFilter === "protocol_status" || laneFilter === "all";



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

          {source === "hybrid" ? (

            <p className="mt-2 text-meta text-slate-400/80" data-tt-traveltrust-announcements-hybrid="1">

              {t("traveltrust_announcements_hybrid_note")}

            </p>

          ) : null}

        </motion.header>



        <div

          className="mt-4 flex flex-wrap gap-2"

          role="group"

          aria-label={t("traveltrust_announcements_filter_label")}

        >

          {FILTER_CHIPS.map((chip) => (

            <button

              key={chip}

              type="button"

              aria-pressed={laneFilter === chip}

              className={`rounded-full border px-3 py-1 text-meta transition ${

                laneFilter === chip

                  ? "border-ref-sun/50 bg-ref-sun/10 text-ref-sun"

                  : "border-white/10 text-slate-400 hover:border-white/20"

              }`}

              onClick={() => setLaneFilter(chip)}

            >

              {t(`traveltrust_announcements_filter_${chip}`)}

            </button>

          ))}

        </div>



        {showMainPlate && laneFilter !== "protocol_status" ? (

          <div

            className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} mt-4 sm:mt-5`}

            data-tt-traveltrust-announcements-warm-plate-l5="1"

            data-tt-traveltrust-announcements-product-plate="1"

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

                showListDates={false}

                showKindBadge={laneFilter === "governance"}

              />

            )}

          </div>

        ) : null}



        {showTtg ? (

          <>

            <TravelTrustSectionFilmDivider />

            <section

              id={TRAVELTRUST_ANNOUNCEMENTS_TTG_SECTION_ID}

              className="mt-6 scroll-mt-28 sm:mt-7"

              aria-labelledby="traveltrust-ann-ttg-title"

            >

              <h2

                id="traveltrust-ann-ttg-title"

                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ref-sun/75"

              >

                {t("traveltrust_announcements_ttg_section_title")}

              </h2>

              <p className="mt-1 text-meta text-slate-400/90">{t("traveltrust_announcements_ttg_section_lead")}</p>

              <div className="mt-4 sm:mt-5">

                <TravelTrustTtgRoundPanel />

              </div>

              {laneFilter === "all" && governanceItems.length > 0 ? (

                <div className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} mt-4 sm:mt-5`}>

                  <TravelTrustAnnouncementsList

                    items={governanceItems}

                    focusId={focusId}

                    onViewDetail={openDetail}

                    showKindBadge

                  />

                </div>

              ) : null}

            </section>

          </>

        ) : null}



        {showProtocolSection && protocolItems.length > 0 ? (

          <>

            <TravelTrustSectionFilmDivider />

            <section

              id={TRAVELTRUST_ANNOUNCEMENTS_PROTOCOL_SECTION_ID}

              className="mt-6 scroll-mt-28 sm:mt-7"

              aria-labelledby="traveltrust-ann-protocol-title"

              data-tt-traveltrust-announcements-protocol-section="1"

            >

              <h2

                id="traveltrust-ann-protocol-title"

                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ref-sun/75"

              >

                {t("traveltrust_announcements_protocol_section_title")}

              </h2>

              <p className="mt-1 text-meta text-slate-400/90">{t("traveltrust_announcements_protocol_section_lead")}</p>

              {showProtocolDisclaimer ? (

                <p

                  className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-meta text-amber-100/90"

                  data-tt-traveltrust-protocol-disclaimer="1"

                >

                  {t("traveltrust_announcements_protocol_section_disclaimer")}

                </p>

              ) : null}

              <div className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} mt-4 sm:mt-5`}>

                {laneFilter === "protocol_status" ? (

                  loading ? (

                    <p className="px-4 py-6 text-meta text-slate-400">{t("traveltrust_announcements_loading")}</p>

                  ) : (

                    <TravelTrustAnnouncementsList

                      items={visibleItems}

                      focusId={focusId}

                      onViewDetail={openDetail}

                      showListDates

                      showKindBadge={false}

                    />

                  )

                ) : (

                  <TravelTrustAnnouncementsList

                    items={protocolItems}

                    focusId={focusId}

                    onViewDetail={openDetail}

                    showListDates

                    showKindBadge={false}

                  />

                )}

              </div>

            </section>

          </>

        ) : null}



        {showRoadmap ? (

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


