"use client";



import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";

import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_LINK_FOCUS_CLASS } from "@/lib/adminUi";

import { touchTargetLink44Classes, travelFocusRingCoreOffset2WhiteClasses } from "@/lib/travelLinkFocus";



/** 与 Shell 六域同序：入驻 → 经营 → 社区 → 资金 → 治理 */

const PINNED: { href: string; labelKey: string }[] = [

  { href: ADMIN_INBOX_QUEUE_HREFS.provider, labelKey: "admin_shell_nav_group_onboarding" },

  { href: "/admin/orders", labelKey: "admin_shell_nav_group_operations" },

  { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_shell_nav_group_community" },

  { href: "/admin/finance-suite", labelKey: "admin_shell_nav_group_finance" },

  { href: "/admin/cross-check", labelKey: "admin_shell_nav_group_governance" },

  { href: "/admin/permissions#admin-shell-preview", labelKey: "admin_shell_nav_group_more" },

];



export function AdminHomePinnedShortcuts() {

  const { t } = useTranslation();



  return (

    <section

      className="rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4"

      aria-label={t("admin_home_pinned_aria")}

      data-tt-admin-home-pinned="1"

    >

      <h2 className="text-body font-semibold text-ink-900">{t("admin_home_pinned_title")}</h2>

      <p className="mt-1 text-meta text-ink-500">{t("admin_home_pinned_hint")}</p>

      <ul className="mt-3 flex flex-wrap gap-2">

        {PINNED.map(({ href, labelKey }) => (

          <li key={href}>

            <Link

              href={href}

              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-small font-medium text-ink-800 hover:border-ink-400 hover:bg-white ${travelFocusRingCoreOffset2WhiteClasses} ${ADMIN_LINK_FOCUS_CLASS}`}

            >

              {t(labelKey)}

            </Link>

          </li>

        ))}

      </ul>

    </section>

  );

}

