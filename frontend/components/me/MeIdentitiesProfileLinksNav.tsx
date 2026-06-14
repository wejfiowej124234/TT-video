"use client";

import Link from "next/link";
import { MeIdentitiesProfileLinkThumb } from "@/components/me/MeIdentitiesProfileLinkThumb";
import type { MeIdentitiesProfileLink } from "@/lib/me/meIdentitiesProfileLinksModel";
import type { MeIdentitiesProfileLinkThumbs } from "@/lib/me/useMeIdentitiesProfileLinkThumbs";
import { TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";

type TFunc = (key: string) => string;

/** Hub 底部「身份资料」· L5 横向媒体行（左大图 · 右标题/说明 · 与上方纵卡分层）。 */
export function MeIdentitiesProfileLinksNav({
  t,
  links,
  thumbs,
}: {
  t: TFunc;
  links: readonly MeIdentitiesProfileLink[];
  thumbs?: MeIdentitiesProfileLinkThumbs;
}) {
  if (links.length === 0) return null;

  return (
    <section className={`${TT_ME_IDENTITIES_L5.gridSection} mt-8`} aria-labelledby="me-identities-profile-links-heading">
      <h2 id="me-identities-profile-links-heading" className={TT_ME_IDENTITIES_L5.applySectionTitle}>
        {t("me_identities_profile_links_section_title")}
      </h2>
      <p className="mb-4 text-meta leading-relaxed text-slate-400/95">{t("me_identities_profile_links_section_hint")}</p>
      <ul
        className="relative z-[1] m-0 list-none space-y-3 p-0"
        aria-label={t("me_identities_profile_links_list_aria")}
        data-tt-me-identities-profile-links="1"
      >
        {links.map((link) => (
          <li key={link.id} className="flex">
            <Link
              href={link.href}
              className={TT_ME_IDENTITIES_L5.profileLinkCard}
              data-tt-me-identities-profile-link={link.id}
              aria-label={`${t(link.labelKey)} — ${t(link.descKey)}`}
            >
              <span className={TT_ME_IDENTITIES_L5.cardAmbient} aria-hidden />
              <span className={TT_ME_IDENTITIES_L5.cardSheen} aria-hidden />
              <MeIdentitiesProfileLinkThumb linkId={link.id} src={thumbs?.[link.id]} />
              <span className={TT_ME_IDENTITIES_L5.profileLinkBody}>
                <span className={`${TT_ME_IDENTITIES_L5.cardTitle} block text-small sm:text-h4`}>{t(link.labelKey)}</span>
                <span className={`${TT_ME_IDENTITIES_L5.cardDesc} mt-1 block text-meta leading-snug`}>
                  {t(link.descKey)}
                </span>
                <span className={TT_ME_IDENTITIES_L5.profileLinkFooter}>
                  <span className={`${TT_ME_IDENTITIES_L5.cardCta} mt-0 min-h-0 text-meta`}>
                    {t("me_identities_profile_link_open")}
                  </span>
                  <span className={TT_ME_IDENTITIES_L5.profileLinkArrow} aria-hidden>
                    →
                  </span>
                </span>
              </span>
              <span className={TT_ME_IDENTITIES_L5.cardFloor} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
