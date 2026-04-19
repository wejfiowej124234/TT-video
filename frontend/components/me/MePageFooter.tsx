"use client";

import Link from "next/link";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { FOCUS_RING } from "./constants";

export interface MePageFooterProps {
  t: (k: string) => string;
  /** 社区「我的」：缩短页尾，隐藏基建标签墙 */
  variant?: "full" | "compact";
}

export default function MePageFooter({ t, variant = "full" }: MePageFooterProps) {
  const compact = variant === "compact";
  return (
    <footer className={compact ? "mt-4 pt-3 border-t border-slate-700/45" : "mt-8 pt-6 border-t border-slate-700/50"}>
      {compact ? null : <TrustInfraWall />}
      <ProductCrossNav
        ariaLabelKey="me_relatedNav_aria"
        showGuides
        className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300 ${compact ? "mt-0" : "mt-4"}`}
        linkClassName={`inline-flex items-center justify-center text-cyan-300 hover:text-cyan-100 font-medium motion-sub ${compact ? "min-h-[40px] px-1" : "min-h-[44px]"} ${FOCUS_RING}`}
        separatorClassName="text-slate-500"
      />
      <p className={`text-center ${compact ? "mt-2 text-[0.7rem] text-slate-400" : "mt-4 text-small"}`}>
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
