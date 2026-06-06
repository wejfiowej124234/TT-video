"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_MARKETING_HOME_HERO_AUX_LINK } from "@/lib/marketingUi";

const AUX_LINKS = [
  { href: "/community", labelKey: "landing_aux_companion" },
  { href: "/guides", labelKey: "landing_aux_join" },
  { href: "/traveltrust", labelKey: "landing_aux_protocol" },
] as const;

/** `/` Hero 下三链：寻找旅伴 · 线上加盟 · 协议支持（88 §一 · L5 截图 SSOT） */
export default function LandingHeroAuxLinks() {
  const { t } = useTranslation();
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
      aria-label={t("landing_aux_nav_aria")}
    >
      {AUX_LINKS.map((item) => (
        <Link
          key={item.labelKey}
          href={item.href}
          className={`${TT_MARKETING_HOME_HERO_AUX_LINK} min-h-[44px] inline-flex items-center px-4`}
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
