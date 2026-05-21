/**
 * Stable DOM ids for /traveltrust section headings (a11y).
 * Do not use `useId()` here — `TravelTrustIdentityTheater` is `ssr: false`, which skews
 * React's id counter between SSR and hydration for later siblings.
 */
export const TT_TRAVELTRUST_SECTION_A11Y = {
  hero: { title: "tt-traveltrust-hero-title" },
  roles: { title: "tt-traveltrust-roles-title" },
  liquidity: { title: "tt-traveltrust-liquidity-title" },
  trust: { title: "tt-traveltrust-trust-title" },
  settlement: { title: "tt-traveltrust-settlement-title" },
  faq: {
    title: "tt-traveltrust-faq-title",
    intro: "tt-traveltrust-faq-intro",
    list: "tt-traveltrust-faq-list",
  },
  start: { title: "tt-traveltrust-start-title" },
  regionRoster: {
    heading: "tt-traveltrust-region-roster-heading",
    hint: "tt-traveltrust-region-roster-hint",
  },
  roleVideo: { hint: "tt-traveltrust-role-video-hint" },
} as const;
