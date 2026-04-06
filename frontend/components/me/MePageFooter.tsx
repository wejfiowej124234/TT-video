"use client";

import Link from "next/link";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { FOCUS_RING } from "./constants";

export interface MePageFooterProps {
  t: (k: string) => string;
}

export default function MePageFooter({ t }: MePageFooterProps) {
  return (
    <footer className="mt-8 pt-6 border-t border-slate-700/50">
      <TrustInfraWall />
      <ProductCrossNav
        ariaLabelKey="me_relatedNav_aria"
        showGuides
        className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
        linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 font-medium motion-sub ${FOCUS_RING}`}
        separatorClassName="text-slate-500"
      />
      <p className="mt-4 text-center text-small">
        <Link href="/" className={`text-cyan-300 hover:text-cyan-100 font-medium motion-sub ${FOCUS_RING}`}>
          {t("me_back")}
        </Link>
        {" · "}
        <Link href="/community" className={`text-slate-300 hover:text-slate-300 motion-sub ${FOCUS_RING}`}>{t("header_community")}</Link>
        {" · "}
        <Link href="/community/me/posts" className={`text-slate-300 hover:text-slate-300 motion-sub ${FOCUS_RING}`}>{t("community_me_my_posts")}</Link>
        {" · "}
        <Link href="/community/me/reports" className={`text-slate-300 hover:text-slate-300 motion-sub ${FOCUS_RING}`}>{t("community_me_my_reports")}</Link>
        {" · "}
        <Link href="/did-rank" className={`text-slate-300 hover:text-slate-300 motion-sub ${FOCUS_RING}`}>{t("didRank_title")}</Link>
      </p>
    </footer>
  );
}
