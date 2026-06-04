"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { rolePrimaryCtaFallback } from "@/lib/admin/adminHomePrimaryCtaByRole";
import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import {
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_INBOX_TASK_CTA_IDLE_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const CTA_CANDIDATES: {
  key: keyof AdminHomeInboxCounts;
  href: string;
  labelKey: string;
}[] = [
  {
    key: "provider",
    href: ADMIN_INBOX_QUEUE_HREFS.provider,
    labelKey: "admin_home_primary_cta_provider",
  },
  {
    key: "steward",
    href: ADMIN_INBOX_QUEUE_HREFS.steward,
    labelKey: "admin_home_primary_cta_steward",
  },
  {
    key: "approvals",
    href: ADMIN_INBOX_QUEUE_HREFS.approvals,
    labelKey: "admin_home_primary_cta_approvals",
  },
  {
    key: "reports",
    href: ADMIN_INBOX_QUEUE_HREFS.reports,
    labelKey: "admin_home_primary_cta_reports",
  },
];

export function AdminHomePrimaryCtas(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  loading: boolean;
  consoleRole70?: ConsoleRole70 | null;
}) {
  const { t } = useTranslation();
  const { counts, channels, loading, consoleRole70 = null } = props;

  const links = useMemo(() => {
    const scored: { href: string; labelKey: string; score: number }[] = [];
    for (const c of CTA_CANDIDATES) {
      if (channels[c.key].permissionDenied) continue;
      const n = counts[c.key];
      if (n !== null && n > 0) {
        scored.push({ href: c.href, labelKey: c.labelKey, score: n });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    if (scored.length >= 3) return scored.slice(0, 3);
    const fallback = rolePrimaryCtaFallback(consoleRole70);
    const seen = new Set(scored.map((s) => s.href));
    for (const f of fallback) {
      if (scored.length >= 3) break;
      if (!seen.has(f.href)) {
        scored.push({ ...f, score: 0 });
        seen.add(f.href);
      }
    }
    return scored.slice(0, 3);
  }, [counts, channels, consoleRole70]);

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label={t("admin_home_primary_cta_aria")}
      data-tt-admin-home-primary-cta="1"
    >
      {links.map(({ href, labelKey, score }) => (
        <Link
          key={href}
          href={href}
          className={`${touchTargetLink44Classes} ${
            score > 0
              ? ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS
              : `${ADMIN_INBOX_TASK_CTA_IDLE_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`
          }`}
        >
          {t(labelKey)}
        </Link>
      ))}
      {loading ? (
        <span className="self-center text-meta text-ink-500">{t("admin_home_kpi_loading")}</span>
      ) : null}
    </nav>
  );
}
