import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";

/** v6 Hero 3D 场景参数（① 本地；尊重 reduced-motion / 移动端降载） */
export const TT_CINEMATIC_3D_BG = "#0a0f0d";

/** 品牌 3D 色板 — 与 globals.css ref-* / ink 同源 */
export const TT_BRAND_3D = {
  bg: "#0a0f0d",
  ink: "#14100d",
  cyan: "#23ced9",
  coral: "#fca47c",
  mint: "#6ee7b7",
  teal: "#0c6e69",
  sky: "#7dd3fc",
} as const;
/** 角色剧场 3D 环主色（与 UI accent 同源） */
export const ROLE_CINEMATIC_3D_COLORS: Record<
  TravelTrustRoleId,
  { primary: string; secondary: string; pulse: string }
> = {
  traveler: { primary: "#23ced9", secondary: "#6ee7b7", pulse: "#ffffff" },
  guide: { primary: "#fca47c", secondary: "#fbbf24", pulse: "#fde68a" },
  provider: { primary: "#fbbf24", secondary: "#fca47c", pulse: "#fff7ed" },
  region_steward: { primary: "#0c6e69", secondary: "#34d399", pulse: "#a7f3d0" },
};
export type TravelTrustCinematic3dConfig = {
  globeRadius: number;
  nodeCount: number;
  dustCount: number;
  starCount: number;
  parallaxStrength: number;
  autoRotateSpeed: number;
  maxConnectionDist: number;
  orbitalArcs: number;
};

export const TT_CINEMATIC_3D_LOW: TravelTrustCinematic3dConfig = {
  globeRadius: 1.85,
  nodeCount: 14,
  dustCount: 48,
  starCount: 900,
  parallaxStrength: 0.22,
  autoRotateSpeed: 0.07,
  maxConnectionDist: 1.28,
  orbitalArcs: 3,
};

export const TT_CINEMATIC_3D_DESKTOP: TravelTrustCinematic3dConfig = {
  globeRadius: 1.78,
  nodeCount: 24,
  dustCount: 140,
  starCount: 3000,
  parallaxStrength: 0.58,
  autoRotateSpeed: 0.1,
  maxConnectionDist: 1.38,
  orbitalArcs: 5,
};

export const TT_CINEMATIC_3D_MOBILE: TravelTrustCinematic3dConfig = {
  globeRadius: 1.72,
  nodeCount: 12,
  dustCount: 36,
  starCount: 720,
  parallaxStrength: 0.18,
  autoRotateSpeed: 0.05,
  maxConnectionDist: 1.2,
  orbitalArcs: 2,
};

/** 电影镜头与叙事节奏（全页 WebGL 编排） */
export const TT_CINEMATIC_FILM = {
  heroIntroDollyZ: 0.72,
  heroBreathFov: 0.95,
  routePulseCountDesktop: 1,
  routePulseCountMobile: 0,
  escrowFilamentOpacity: 0.22,
} as const;

export const TT_CINEMATIC_NODE_COLORS = [
  "#23ced9",
  "#6ee7b7",
  "#fca47c",
  "#7dd3fc",
] as const;
