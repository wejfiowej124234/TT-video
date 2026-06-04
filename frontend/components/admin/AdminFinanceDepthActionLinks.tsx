"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceDepthHonestyFooter } from "@/components/admin/AdminFinanceDepthHonestyFooter";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export type AdminFinanceDepthLink = {
  href: string;
  labelKey: string;
};

/** FIN-02 · ① partial 深度面板统一动作链 + 诚实页脚。 */
export function AdminFinanceDepthActionLinks(props: { links: readonly AdminFinanceDepthLink[] }) {
  const { t } = useTranslation();
  const { links } = props;

  return (
    <>
      <ul className="mt-4 flex flex-wrap gap-2" data-tt-admin-fin-depth-actions="1">
        {links.map((link) => (
          <li key={`${link.href}-${link.labelKey}`}>
            <Link
              href={link.href}
              className={`${touchTargetLink44Classes} ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS}`}
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
      <AdminFinanceDepthHonestyFooter />
    </>
  );
}
