"use client";



import Link from "next/link";

import { useEffect, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { useTranslation } from "@/components/LocaleProvider";

import {

  fetchTraveltrustRoadmapBundle,

  resolveRoadmapMilestoneTargetLabel,

  resolveRoadmapSectionCopy,

  type TravelTrustRoadmapMilestoneDisplay,

} from "@/lib/traveltrustCmsRoadmap";

import { TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR } from "@/lib/cmsRoadmapTypes";

import {

  traveltrustRoadmapStatusLabelKey,

  type TravelTrustRoadmapOpsStatus,

} from "@/lib/traveltrustRoadmap2026";

import { traveltrustContentTierLabelKey } from "@/lib/traveltrustNetworkAnnouncements";

import { TT_ANNOUNCEMENTS_MOTION_L5, TT_PULSE_KIND_L5, TT_ROADMAP_L5 } from "@/lib/traveltrust/l5";



const KIND_STYLE = TT_PULSE_KIND_L5;



function opsStatusBadgeClass(status: TravelTrustRoadmapOpsStatus): string {

  switch (status) {

    case "in_progress":

      return TT_ROADMAP_L5.statusInProgressClass;

    case "completed":

      return TT_ROADMAP_L5.statusCompleteClass;

    default:

      return TT_ROADMAP_L5.statusUpcomingClass;

  }

}



function itemSurfaceClass(status: TravelTrustRoadmapOpsStatus): string {

  switch (status) {

    case "in_progress":

      return TT_ROADMAP_L5.itemLiveClass;

    case "completed":

      return TT_ROADMAP_L5.itemCompleteClass;

    default:

      return TT_ROADMAP_L5.itemUpcomingClass;

  }

}



function MilestoneRow({

  item,

  index,

  periodLabel,

  localeIsZh,

}: {

  item: TravelTrustRoadmapMilestoneDisplay;

  index: number;

  periodLabel: string;

  localeIsZh: boolean;

}) {

  const { t } = useTranslation();

  const reduceMotion = useReducedMotion();

  const ctaKind = item.ctaKind ?? "learn_more";

  const targetLabel = resolveRoadmapMilestoneTargetLabel(item, periodLabel, t);

  const title = item.cmsCopy

    ? localeIsZh

      ? item.cmsCopy.titleZh

      : item.cmsCopy.titleEn

    : t(item.messageKey);

  const benefit = item.cmsCopy

    ? localeIsZh

      ? item.cmsCopy.summaryZh

      : item.cmsCopy.summaryEn

    : t(item.benefitKey);

  const anchor = TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR;



  return (

    <motion.li

      id={`${anchor}-${item.id}`}

      className={`${TT_ROADMAP_L5.itemClass} ${itemSurfaceClass(item.status)} scroll-mt-28`}

      data-tt-traveltrust-roadmap-item={item.id}

      data-tt-traveltrust-roadmap-status={item.status}

      initial={reduceMotion ? false : { opacity: 0, y: 8 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{

        duration: TT_ANNOUNCEMENTS_MOTION_L5.listItem.duration,

        ease: TT_ANNOUNCEMENTS_MOTION_L5.listItem.ease,

        delay: index * TT_ANNOUNCEMENTS_MOTION_L5.listStagger,

      }}

    >

      <div className={TT_ROADMAP_L5.rowClass}>

        <p className={TT_ROADMAP_L5.dateClass}>{targetLabel}</p>

        <div className={TT_ROADMAP_L5.bodyClass}>

          <div className="flex flex-wrap items-center gap-2">

            <span className={`${TT_ROADMAP_L5.kindClass} ${KIND_STYLE[item.kind]}`}>

              {t(`traveltrust_pulse_kind_${item.kind}`)}

            </span>

            <span className={`${TT_ROADMAP_L5.statusBadgeClass} ${TT_ROADMAP_L5.tierRoadmapClass}`}>

              {t(traveltrustContentTierLabelKey(item.contentTier))}

            </span>

          </div>

          <p className={TT_ROADMAP_L5.headlineClass}>{title}</p>

          <p className={TT_ROADMAP_L5.benefitClass}>{benefit}</p>

          <span className={`${TT_ROADMAP_L5.statusBadgeClass} ${opsStatusBadgeClass(item.status)}`}>

            {t(traveltrustRoadmapStatusLabelKey(item.status))}

          </span>

          {item.href ? (

            <Link href={item.href} className={TT_ROADMAP_L5.ctaClass}>

              {t(`traveltrust_pulse_cta_${ctaKind}`)} ›

            </Link>

          ) : null}

        </div>

      </div>

    </motion.li>

  );

}



/** Product roadmap — CMS-first with static fallback */

export function TravelTrustRoadmapTimeline() {

  const { t, locale } = useTranslation();

  const localeIsZh = locale?.startsWith("zh") ?? true;

  const [milestones, setMilestones] = useState<TravelTrustRoadmapMilestoneDisplay[]>([]);

  const [sectionCopy, setSectionCopy] = useState(() =>

    resolveRoadmapSectionCopy(null, localeIsZh, t),

  );

  const [loaded, setLoaded] = useState(false);



  useEffect(() => {

    let cancelled = false;

    void fetchTraveltrustRoadmapBundle().then((bundle) => {

      if (cancelled) return;

      setMilestones(bundle.milestones);

      setSectionCopy(resolveRoadmapSectionCopy(bundle.section, localeIsZh, t));

      setLoaded(true);

    });

    return () => {

      cancelled = true;

    };

  }, [localeIsZh, t]);



  const anchorId = sectionCopy.anchorId || TRAVELTRUST_PRODUCT_ROADMAP_ANCHOR;



  return (

    <section

      id={anchorId}

      className={TT_ROADMAP_L5.sectionClass}

      data-tt-traveltrust-roadmap="1"

      data-tt-traveltrust-roadmap-loaded={loaded ? "1" : "0"}

      aria-labelledby="traveltrust-product-roadmap-title"

    >

      <header className={TT_ROADMAP_L5.headerClass}>

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ref-sun/80">

          {sectionCopy.kicker}

        </p>

        <h2 id="traveltrust-product-roadmap-title" className={TT_ROADMAP_L5.titleClass}>

          {sectionCopy.title}

        </h2>

        <p className={TT_ROADMAP_L5.subtitleClass}>{sectionCopy.subtitle}</p>

        <p className={TT_ROADMAP_L5.disclaimerClass}>{sectionCopy.disclaimer}</p>

      </header>

      <div className={TT_ROADMAP_L5.plateClass} data-tt-traveltrust-roadmap-plate-l5="1">

        <motion.ul

          className={TT_ROADMAP_L5.listClass}

          role="list"

          initial="hidden"

          animate="visible"

          variants={{

            hidden: {},

            visible: { transition: { staggerChildren: TT_ANNOUNCEMENTS_MOTION_L5.listStagger } },

          }}

        >

          {milestones.map((item, index) => (

            <MilestoneRow

              key={item.id}

              item={item}

              index={index}

              periodLabel={sectionCopy.periodLabel}

              localeIsZh={localeIsZh}

            />

          ))}

        </motion.ul>

      </div>

    </section>

  );

}


