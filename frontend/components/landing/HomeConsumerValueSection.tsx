"use client";

import Link from "next/link";
import { memo } from "react";

import { CARD_SCENIC_IMAGES } from "@/components/landing/constants";
import { buildPesAuthHref } from "@/lib/pesAuthReturnFlow";
import { trackPesCtaClick, trackPesRoleEntryClick } from "@/lib/conversionAnalyticsLayer";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type HomeConsumerValueSectionProps = {
  t: (key: string) => string;
  className?: string;
};

const VALUE_CARD_IMAGES = [
  CARD_SCENIC_IMAGES[4]!,
  CARD_SCENIC_IMAGES[1]!,
  CARD_SCENIC_IMAGES[2]!,
] as const;

type ValueCardConfig = {
  id: string;
  image: string;
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
  href: string;
  ctaId: string;
};

function HomeConsumerValueSectionInner({ t, className = "" }: HomeConsumerValueSectionProps) {
  const cards: ValueCardConfig[] = [
    {
      id: "plan",
      image: VALUE_CARD_IMAGES[0],
      titleKey: "home_consumer_value_plan_title",
      bodyKey: "home_consumer_value_plan_body",
      ctaKey: "home_consumer_value_plan_cta",
      href: "#form",
      ctaId: "home_consumer_plan",
    },
    {
      id: "guides",
      image: VALUE_CARD_IMAGES[1],
      titleKey: "home_consumer_value_guides_title",
      bodyKey: "home_consumer_value_guides_body",
      ctaKey: "home_consumer_value_guides_cta",
      href: "/market",
      ctaId: "home_consumer_guides",
    },
    {
      id: "community",
      image: VALUE_CARD_IMAGES[2],
      titleKey: "home_consumer_value_community_title",
      bodyKey: "home_consumer_value_community_body",
      ctaKey: "home_consumer_value_community_cta",
      href: "/community",
      ctaId: "home_consumer_community",
    },
  ];

  const guideHref = buildPesAuthHref("login", "/guide/register", "guide_recruit", "/guide/register");
  const merchantHref = buildPesAuthHref("register", "/provider/register", "merchant_onboard", "/provider/register");

  return (
    <section
      className={`mx-auto w-full max-w-3xl px-3 sm:px-4 ${className}`.trim()}
      aria-label={t("home_consumer_value_aria")}
      data-tt-home-consumer-value="1"
    >
      <header className="mb-3 px-0.5">
        <p className="text-meta font-medium uppercase tracking-wide text-ref-sun [color:var(--ref-sun)]">
          {t("home_consumer_value_kicker")}
        </p>
        <h2 className="mt-1 text-body-l font-bold text-white">{t("home_consumer_value_title")}</h2>
        <p className="mt-1 text-small text-white/75 leading-relaxed">{t("home_consumer_value_lead")}</p>
      </header>

      <ul className="grid gap-2.5 sm:grid-cols-3" data-tt-home-consumer-value-cards="1">
        {cards.map((card) => (
          <li key={card.id}>
            <article
              className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-white/12 bg-ink-900/55 backdrop-blur-sm"
              data-tt-home-consumer-value-card={card.id}
            >
              <div className="relative aspect-[16/10] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" aria-hidden />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="text-small font-semibold text-white">{t(card.titleKey)}</h3>
                <p className="text-meta leading-snug text-white/70">{t(card.bodyKey)}</p>
                <Link
                  href={card.href}
                  onClick={() => trackPesCtaClick("home", card.href, card.ctaId)}
                  className={`mt-auto inline-flex min-h-9 w-fit items-center rounded-full border border-ref-sun/35 bg-ref-sun/12 px-3 py-1.5 text-meta font-semibold text-white hover:bg-ref-sun/22 ${travelFocusRingOffset2Classes}`}
                  data-tt-home-consumer-value-cta={card.id}
                >
                  {t(card.ctaKey)}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <nav
        className="mt-3 rounded-[var(--radius-md)] border border-white/10 bg-ink-900/40 px-3 py-2.5"
        aria-label={t("home_consumer_value_roles_aria")}
        data-tt-home-consumer-secondary-roles="1"
      >
        <p className="text-meta text-white/60">{t("home_consumer_value_roles_label")}</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-meta">
          <li>
            <Link
              href={guideHref}
              onClick={() => trackPesRoleEntryClick("home", "guide", guideHref)}
              className={`font-medium text-cyan-200/95 hover:text-white ${travelFocusRingOffset2Classes}`}
            >
              {t("home_consumer_value_role_guide")}
            </Link>
          </li>
          <li>
            <Link
              href={merchantHref}
              onClick={() => trackPesRoleEntryClick("home", "merchant", merchantHref)}
              className={`font-medium text-cyan-200/95 hover:text-white ${travelFocusRingOffset2Classes}`}
            >
              {t("home_consumer_value_role_merchant")}
            </Link>
          </li>
          <li>
            <Link
              href="/governance"
              onClick={() => trackPesRoleEntryClick("home", "govern", "/governance")}
              className={`font-medium text-cyan-200/95 hover:text-white ${travelFocusRingOffset2Classes}`}
            >
              {t("home_consumer_value_role_govern")}
            </Link>
          </li>
        </ul>
      </nav>
    </section>
  );
}

export const HomeConsumerValueSection = memo(HomeConsumerValueSectionInner);
