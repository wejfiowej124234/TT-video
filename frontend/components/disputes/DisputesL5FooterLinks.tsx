"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { meSettingsDisputesHrefSuffix } from "@/lib/me/meSettingsExtensionContext";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";

export function DisputesL5FooterLinks({
  t,
  showList,
}: {
  t: (key: string) => string;
  showList?: boolean;
}) {
  const searchParams = useSearchParams();
  const disputesListHref = `/disputes${meSettingsDisputesHrefSuffix(searchParams.get("from"))}`;

  return (
    <nav className={TT_DISPUTES_L5.footerLinks} aria-label={t("disputes_l5_footer_aria")}>
      {showList ? (
        <Link href={disputesListHref} className={TT_DISPUTES_L5.footerLink}>
          {t("disputes_listTitle")}
        </Link>
      ) : null}
      <Link href={ME_SETTINGS_HUB_PATH} className={TT_DISPUTES_L5.footerLink}>
        {t("me_settings_pageTitle")}
      </Link>
      <Link href="/orders" className={TT_DISPUTES_L5.footerLink}>
        {t("disputes_navOrders")}
      </Link>
    </nav>
  );
}
