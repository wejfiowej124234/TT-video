/**
 * v6 cinematic landing — four protocol roles (87 §1.1) + hero loop video slots.
 */

export type TravelTrustRoleId = "traveler" | "guide" | "provider" | "region_steward";

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
  icon: "traveler" | "guide" | "provider" | "steward";
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
  provider: "/media/traveltrust/roles/provider.mp4",
  region_steward: "/media/traveltrust/roles/region_steward.mp4",
};

/** 85 v6 叙事顺序：游客 → 向导 → 商家 → 旅行收购 → 区域主理人（TT-PH1-172 · ①） */
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
    id: "provider",
    nameKey: "traveltrust_role_provider_name",
    tagKey: "traveltrust_role_provider_tag",
    enterKey: "traveltrust_role_enter",
    href: "/market",
    defaultMp4: ROLE_DEFAULT_MP4.provider,
    defaultPoster: "/media/traveltrust/roles/provider.poster.svg",
    envMp4: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_PROVIDER?.trim(),
    envPoster: e?.NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_PROVIDER?.trim(),
    accent: {
      ring: "ring-amber-400/40",
      glow: "shadow-[0_0_48px_-8px_rgba(251,191,36,0.35)]",
      tabActive: "border-amber-400/50 bg-amber-400/10 text-amber-200",
      flash: "bg-amber-400/12",
      gradient: "from-amber-300/70 to-ref-sun/50",
    },
    icon: "provider",
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

export function resolveRoleMedia(role: TravelTrustRoleConfig) {
  const mp4 = role.envMp4?.trim() || role.defaultMp4?.trim() || "";
  const poster = role.envPoster?.trim() || role.defaultPoster;
  return { mp4, poster };
}
