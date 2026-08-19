/**
 * `/traveltrust` listing-pack disclosure slots (local product surface).
 * Real whitepaper / LinkedIn / GitHub / Telegram / entity / email land later.
 * Independent audit is honestly empty — no fake badge.
 * href 禁止含 `whitepaper` 片段。
 */

import { TRAVELTRUST_PROTOCOL_PAPER_HREF } from "@/lib/traveltrust/l5";
import { isTraveltrustV6AllowedHref } from "@/lib/traveltrustFundraisingLinkPolicy";

export const TRAVELTRUST_TTG_AVATAR_HREF = "/brand" as const;
export const TRAVELTRUST_TTG_AVATAR_SRC = "/brand/token/ttg-avatar.png" as const;
export const TRAVELTRUST_TTG_AVATAR_256_SRC = "/brand/token/ttg-avatar-256.png" as const;
export const TRAVELTRUST_ASSURANCE_HREF = "/assurance" as const;
export const TRAVELTRUST_CONTACT_HREF = "/contact" as const;
export const TRAVELTRUST_TERMS_HREF = "/terms" as const;
export const TRAVELTRUST_PRIVACY_HREF = "/privacy" as const;

export type TraveltrustFooterDisclosureLink = {
  href: string;
  labelKey:
    | "traveltrust_footer_disclosure_terms"
    | "traveltrust_footer_disclosure_privacy"
    | "traveltrust_footer_disclosure_brand"
    | "traveltrust_footer_disclosure_assurance"
    | "traveltrust_footer_disclosure_contact";
  marker: string;
};

/** 版权行下的送审占位入口（不挤金胶囊三键） */
export const TRAVELTRUST_FOOTER_DISCLOSURE_LINKS: readonly TraveltrustFooterDisclosureLink[] = [
  {
    href: TRAVELTRUST_TERMS_HREF,
    labelKey: "traveltrust_footer_disclosure_terms",
    marker: "data-tt-traveltrust-footer-disclosure-terms",
  },
  {
    href: TRAVELTRUST_PRIVACY_HREF,
    labelKey: "traveltrust_footer_disclosure_privacy",
    marker: "data-tt-traveltrust-footer-disclosure-privacy",
  },
  {
    href: TRAVELTRUST_TTG_AVATAR_HREF,
    labelKey: "traveltrust_footer_disclosure_brand",
    marker: "data-tt-traveltrust-footer-disclosure-brand",
  },
  {
    href: TRAVELTRUST_ASSURANCE_HREF,
    labelKey: "traveltrust_footer_disclosure_assurance",
    marker: "data-tt-traveltrust-footer-disclosure-assurance",
  },
  {
    href: TRAVELTRUST_CONTACT_HREF,
    labelKey: "traveltrust_footer_disclosure_contact",
    marker: "data-tt-traveltrust-footer-disclosure-contact",
  },
] as const;

export const TRAVELTRUST_LISTING_DOC_PREFIXES = [
  TRAVELTRUST_PROTOCOL_PAPER_HREF,
  TRAVELTRUST_TTG_AVATAR_HREF,
  TRAVELTRUST_ASSURANCE_HREF,
  TRAVELTRUST_CONTACT_HREF,
] as const;

export function isListingDocDarkL5HeaderPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return TRAVELTRUST_LISTING_DOC_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`));
}

/** LinkedIn 须是 https `/in/{slug}`；公司首页不算已配置 */
export function isOfficialTeamLinkedInProfileUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host !== "www.linkedin.com" && host !== "linkedin.com") return false;
    return /^\/in\/[A-Za-z0-9_-]+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function assertListingDisclosureHrefsAllowed(): string[] {
  const hrefs = [
    TRAVELTRUST_PROTOCOL_PAPER_HREF,
    ...TRAVELTRUST_FOOTER_DISCLOSURE_LINKS.map((link) => link.href),
  ];
  return hrefs.filter((href) => !isTraveltrustV6AllowedHref(href));
}
