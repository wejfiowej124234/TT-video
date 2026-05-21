/**
 * v6 cinematic landing — five product roles (87 §1.1 / §1.5 · ①) + hero loop video slots.
 *
 * 剧场叙事：游客 · 向导（含原接待方履约）· 商家 · 旅行收购 · 区域主理人
 * API 契约四类仍为 traveler / guide / provider / region_steward（见 traveltrustProductRoleGlossary.ts）
 */

export type TravelTrustRoleId =
  | "traveler"
  | "guide"
  | "merchant"
  | "acquisition"
  | "region_steward";

/** @deprecated 剧场 hash 旧 id `#provider` → `merchant` */
export const TRAVELTRUST_THEATER_ROLE_HASH_ALIASES: Partial<Record<string, TravelTrustRoleId>> = {
  provider: "merchant",
};

export type TravelTrustRoleAccent = {
  ring: string;
  glow: string;
  tabActive: string;
  flash: string;
  gradient: string;
};

export type TravelTrustRoleConfig = {
  id: TravelTrustRoleId;
  nameKey: string;
  tagKey: string;
  enterKey: string;
  href: string;
  defaultMp4: string;
  defaultPoster: string;
  envMp4: string | undefined;
  envPoster: string | undefined;
  accent: TravelTrustRoleAccent;
  icon: "traveler" | "guide" | "merchant" | "acquisition" | "steward";
};

const e = typeof process !== "undefined" ? process.env : undefined;

export const TRAVELTRUST_HERO_LOOP_MP4 =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP?.trim() ?? "" : "";

export const TRAVELTRUST_HERO_LOOP_POSTER =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP_POSTER?.trim() ?? "" : "";

/** Default hero still when loop mp4/poster env unset (v6 §2 V0 fallback). */
export const TRAVELTRUST_HERO_DEFAULT_POSTER = "/media/traveltrust/hero-poster.svg";

/**
 * ① tier-1 占位 MP4（`public/media/traveltrust/hero-loop.mp4`，~1s 静音 H.264）；
 * 生产 / 媒体批：设置 `NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP` 与角色 `NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_*` 覆盖。
 */
export const TRAVELTRUST_HERO_DEFAULT_LOOP = "/media/traveltrust/hero-loop.mp4";

const ROLE_DEFAULT_MP4: Record<TravelTrustRoleId, string> = {
  traveler: "/media/traveltrust/roles/traveler.mp4",
  guide: "/media/traveltrust/roles/guide.mp4",
  merchant: "/media/traveltrust/roles/provider.mp4",
  acquisition: "/media/traveltrust/roles/provider.mp4",
  region_steward: "/media/traveltrust/roles/region_steward.mp4",
};

/** 85 v6 叙事顺序：游客 → 向导 → 商家 → 旅行收购 → 区域主理人（87 §1.6 · ①） */
export const TRAVELTRUST_ROLES: readonly TravelTrustRoleConfig[] = [
  {
    id: "traveler",
    nameKey: "traveltrust_role_traveler_name",
    tagKey: "traveltrust_role_traveler_tag",
    enterKey: "traveltrust_role_enter",
    href: "#start",
    defaultMp4: ROLE_DEFAULT_MP4.traveler,
    defaultPoster: "/media/traveltrust/roles/traveler.poster.svg",
    envMp4: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER?.trim(),
    envPoster: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_TRAVELER?.trim(),
    accent: {
      ring: "ring-ref-cyan/45",
      glow: "shadow-[0_0_48px_-8px_rgba(35,206,217,0.45)]",
      tabActive: "border-ref-cyan/60 bg-ref-cyan/10 text-ref-cyan",
      flash: "bg-ref-cyan/15",
      gradient: "from-ref-cyan/80 to-ref-teal/70",
    },
    icon: "traveler",
  },
  {
    id: "guide",
    nameKey: "traveltrust_role_guide_name",
    tagKey: "traveltrust_role_guide_tag",
    enterKey: "traveltrust_role_enter",
    href: "/guide",
    defaultMp4: ROLE_DEFAULT_MP4.guide,
    defaultPoster: "/media/traveltrust/roles/guide.poster.svg",
    envMp4: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE?.trim(),
    envPoster: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_GUIDE?.trim(),
    accent: {
      ring: "ring-ref-coral/45",
      glow: "shadow-[0_0_48px_-8px_rgba(252,164,124,0.4)]",
      tabActive: "border-ref-coral/60 bg-ref-coral/10 text-ref-coral",
      flash: "bg-ref-coral/15",
      gradient: "from-ref-coral/80 to-ref-sun/60",
    },
    icon: "guide",
  },
  {
    id: "merchant",
    nameKey: "traveltrust_role_merchant_name",
    tagKey: "traveltrust_role_merchant_tag",
    enterKey: "traveltrust_role_enter",
    href: "/market/provider",
    defaultMp4: ROLE_DEFAULT_MP4.merchant,
    defaultPoster: "/media/traveltrust/roles/provider.poster.svg",
    envMp4:
      e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT?.trim() ??
      e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_PROVIDER?.trim(),
    envPoster:
      e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_MERCHANT?.trim() ??
      e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_PROVIDER?.trim(),
    accent: {
      ring: "ring-amber-400/40",
      glow: "shadow-[0_0_48px_-8px_rgba(251,191,36,0.35)]",
      tabActive: "border-amber-400/50 bg-amber-400/10 text-amber-200",
      flash: "bg-amber-400/12",
      gradient: "from-amber-300/70 to-ref-sun/50",
    },
    icon: "merchant",
  },
  {
    id: "acquisition",
    nameKey: "traveltrust_role_acquisition_name",
    tagKey: "traveltrust_role_acquisition_tag",
    enterKey: "traveltrust_role_enter",
    href: "/market/acquisition",
    defaultMp4: ROLE_DEFAULT_MP4.acquisition,
    defaultPoster: "/media/traveltrust/roles/provider.poster.svg",
    envMp4: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION?.trim(),
    envPoster: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_ACQUISITION?.trim(),
    accent: {
      ring: "ring-violet-400/40",
      glow: "shadow-[0_0_48px_-8px_rgba(167,139,250,0.32)]",
      tabActive: "border-violet-400/45 bg-violet-400/10 text-violet-200",
      flash: "bg-violet-400/12",
      gradient: "from-violet-300/70 to-fuchsia-400/45",
    },
    icon: "acquisition",
  },
  {
    id: "region_steward",
    nameKey: "traveltrust_role_steward_name",
    tagKey: "traveltrust_role_steward_tag",
    enterKey: "traveltrust_role_enter",
    href: "/governance",
    defaultMp4: ROLE_DEFAULT_MP4.region_steward,
    defaultPoster: "/media/traveltrust/roles/region_steward.poster.svg",
    envMp4: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD?.trim(),
    envPoster: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_REGION_STEWARD?.trim(),
    accent: {
      ring: "ring-ref-teal/45",
      glow: "shadow-[0_0_48px_-8px_rgba(12,110,105,0.5)]",
      tabActive: "border-ref-teal/55 bg-ref-teal/10 text-ref-teal",
      flash: "bg-ref-teal/15",
      gradient: "from-ref-teal/80 to-emerald-500/50",
    },
    icon: "steward",
  },
] as const;

export function resolveTraveltrustTheaterRoleFromHash(hash: string): TravelTrustRoleId | null {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return null;
  const aliased = TRAVELTRUST_THEATER_ROLE_HASH_ALIASES[id] ?? id;
  return TRAVELTRUST_ROLES.find((r) => r.id === aliased)?.id ?? null;
}

export function resolveRoleMedia(role: TravelTrustRoleConfig) {
  const mp4 = role.envMp4?.trim() || role.defaultMp4?.trim() || "";
  const poster = role.envPoster?.trim() || role.defaultPoster;
  return { mp4, poster };
}
