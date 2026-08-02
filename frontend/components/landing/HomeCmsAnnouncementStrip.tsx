"use client";

import Link from "next/link";
import { memo, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import type { CmsPublicAnnouncementRow } from "@/lib/cmsPublicAnnouncementsTypes";
import {
  fetchHomeCmsAnnouncements,
  pickHomeCmsAnnouncementText,
} from "@/lib/homeCmsAnnouncements";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type HomeCmsAnnouncementStripProps = {
  className?: string;
};

function HomeCmsAnnouncementStripInner({ className = "" }: HomeCmsAnnouncementStripProps) {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<CmsPublicAnnouncementRow[]>([]);
  const [source, setSource] = useState<string>("loading");

  useEffect(() => {
    let cancelled = false;
    void fetchHomeCmsAnnouncements({ limit: 3 }).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setSource(res.source);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // CMS-only: hide on loading / empty / error — never show static copy.
  if (source === "loading" || source === "unavailable" || items.length === 0) {
    return null;
  }

  return (
    <section
      className={`mx-auto w-full max-w-3xl px-3 sm:px-4 ${className}`.trim()}
      data-tt-home-cms-announcements="1"
      data-tt-home-cms-announcements-source={source}
      data-tt-home-cms-announcements-count={items.length}
      aria-label={t("home_cms_announcements_aria")}
    >
      <div className="space-y-2" data-tt-home-cms-announcements-panel="1">
        <header className="px-0.5">
          <p className="text-meta font-medium uppercase tracking-wide text-ref-sun [color:var(--ref-sun)]">
            {t("home_cms_announcements_kicker")}
          </p>
          <p className="mt-0.5 text-meta text-white/70">{t("home_cms_announcements_lead")}</p>
        </header>
        <ul className="flex flex-col gap-2" data-tt-home-cms-announcements-list="1">
          {items.map((row) => {
            const { title, summary } = pickHomeCmsAnnouncementText(row, locale);
            const href = row.cta_href?.trim() || "/traveltrust/announcements";
            const external = href.startsWith("http");
            return (
              <li key={row.id}>
                <article
                  className="rounded-[var(--radius-md)] border border-white/12 bg-ink-900/55 px-3 py-2.5 backdrop-blur-sm"
                  data-tt-home-cms-announcement-slug={row.slug}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-small font-semibold text-white">{title}</h3>
                    {row.published_at ? (
                      <time className="text-meta text-white/50" dateTime={row.published_at}>
                        {row.published_at.slice(0, 10)}
                      </time>
                    ) : null}
                  </div>
                  {summary ? (
                    <p className="mt-1 text-meta leading-snug text-white/75">{summary}</p>
                  ) : null}
                  <Link
                    href={href}
                    className={`mt-1.5 inline-flex text-meta text-ref-sun underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {t("home_cms_announcements_cta")}
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export const HomeCmsAnnouncementStrip = memo(HomeCmsAnnouncementStripInner);
