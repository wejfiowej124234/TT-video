"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

const OFFICIAL_GROWTH_LINKS = [
  { href: "/admin/growth/referral-codes", labelKey: "admin_ops_crossnav_referral_codes" },
  { href: "/admin/growth/kol-center", labelKey: "admin_ops_crossnav_kol_center" },
  { href: "/admin/growth/analytics", labelKey: "admin_ops_crossnav_growth_analytics" },
  { href: "/admin/official", labelKey: "admin_ops_crossnav_official_hub" },
] as const;

/** 官方运营子页 · Growth 互链（去重 R2） */
export function OfficialOpsCrossNav() {
  const { t } = useTranslation();
  return (
    <nav
      className="mb-6 flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-ref-sun/16 bg-bg-console/80 px-4 py-3"
      aria-label={t("admin_ops_crossnav_aria")}
      data-tt-admin-official-ops-crossnav="1"
    >
      <span className="w-full text-small text-ink-600">{t("admin_ops_crossnav_lead")}</span>
      {OFFICIAL_GROWTH_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={adminPageNavLinkClass()}>
          {t(link.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
