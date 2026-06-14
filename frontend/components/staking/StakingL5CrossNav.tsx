"use client";



import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";



const LINK =

  `${touchTargetLink44Classes} inline-flex items-center text-small font-medium text-ref-sun/75 underline decoration-ref-sun/35 underline-offset-4 hover:text-[#fde9a8] hover:decoration-ref-sun/55 transition-colors motion-reduce:transition-none ${authL5InlineLinkFocusClasses}`;



/** 体验深壳底栏交叉链（暖金 · 非 ProductCrossNav 浅 Console 蓝链） */

export function StakingL5CrossNav() {

  const { t } = useTranslation();



  return (

    <footer className="mt-2" data-tt-staking-l5-footer="1">

      <nav

        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-ref-sun/12 pt-6 text-meta"

        aria-label={t("staking_relatedNav_aria")}

        data-tt-staking-l5-cross-nav="1"

      >

        <Link href="/" className={LINK}>

          {t("itin_nav_home")}

        </Link>

        <span className="text-ref-sun/25" aria-hidden>

          ·

        </span>

        <Link href="/guide" className={LINK}>

          {t("staking_crossNav_guideWorkbench")}

        </Link>

        <span className="text-ref-sun/25" aria-hidden>

          ·

        </span>

        <Link href="/staking?scope=guide#guide-identity-stake" className={LINK}>

          {t("staking_crossNav_guideStaking")}

        </Link>

        <span className="text-ref-sun/25" aria-hidden>

          ·

        </span>

        <Link href="/guides" className={LINK}>

          {t("nav_guides")}

        </Link>

        <span className="text-ref-sun/25" aria-hidden>

          ·

        </span>

        <Link href="/help" className={LINK}>

          {t("help_title")}

        </Link>

        <span className="text-ref-sun/25" aria-hidden>

          ·

        </span>

        <Link href="/trust" className={LINK}>

          {t("staking_crossNav_trust")}

        </Link>

      </nav>

      <p

        className={`mt-4 border-t border-ref-sun/8 pt-4 text-center ${TT_STAKING_PAGE_L5.disclaimer}`}

        role="note"

        data-tt-staking-disclaimer="1"

      >

        {t("staking_disclaimer")}

      </p>

    </footer>

  );

}

