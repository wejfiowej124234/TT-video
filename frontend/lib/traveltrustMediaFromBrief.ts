import type { TravelTrustPageBrief } from "@/lib/traveltrustPageBrief";
import {
  TRAVELTRUST_HERO_DEFAULT_LOOP,
  TRAVELTRUST_HERO_DEFAULT_POSTER,
  TRAVELTRUST_HERO_LOOP_MP4,
  TRAVELTRUST_HERO_LOOP_POSTER,
  TRAVELTRUST_ROLES,
  resolveRoleMedia,
  type TravelTrustRoleConfig,
  type TravelTrustRoleId,
} from "@/app/traveltrust/traveltrustIdentityModel";
import { readTraveltrustPublicEnv } from "@/lib/traveltrustPublicEnv";

/** page-brief `media.hero_loop_env` → env → tier-1 默认（与 API 契约同源） */
export type HeroMediaTier = "production" | "tier1-placeholder";

/**
 * ② 本地：在已跑 `npm run media:traveltrust-tier1` 后设 `NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=tier1-playback`
 * 可播 public 下 tier-1 MP4（仍非实拍，但不再显示「视频待接入」暖占位）。
 * ① 默认不设 → `tier1-placeholder` 暖占位（L5 叙事闭卷）。
 */
export type TraveltrustTheaterMediaMode = "default" | "tier1-playback" | "production";

export function readTraveltrustTheaterMediaMode(): TraveltrustTheaterMediaMode {
  const raw = readTraveltrustPublicEnv("NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE");
  if (raw === "tier1-playback" || raw === "production") return raw;
  return "default";
}

function resolveMediaTier(hasProductionMp4: boolean): HeroMediaTier {
  if (hasProductionMp4) return "production";
  const mode = readTraveltrustTheaterMediaMode();
  if (mode === "tier1-playback" || mode === "production") return "production";
  return "tier1-placeholder";
}

export type HeroMediaResolution = {
  mp4: string;
  poster: string;
  tier: HeroMediaTier;
  loopEnvKey: string;
  posterEnvKey: string;
};

export type RoleMediaResolution = {
  roleId: TravelTrustRoleId;
  mp4: string;
  webm: string;
  poster: string;
  tier: HeroMediaTier;
  mp4EnvKey: string | null;
  posterEnvKey: string | null;
};

/** 与 `traveltrust_page_brief_json` `media.role_video_env_keys` 同序（五角色） */
const ROLE_BRIEF_VIDEO_INDEX: Record<TravelTrustRoleId, number> = {
  traveler: 0,
  guide: 1,
  merchant: 2,
  acquisition: 3,
  region_steward: 4,
};

export function resolveHeroMediaFromBrief(brief: TravelTrustPageBrief | null) {
  const loopKey = brief?.media?.hero_loop_env;
  const posterKey = brief?.media?.hero_loop_poster_env;
  return {
    mp4: readTraveltrustPublicEnv(loopKey),
    poster: readTraveltrustPublicEnv(posterKey),
  };
}

/**
 * Hero 媒体解析链（真源顺序）：
 * 1. page-brief `media.*_env` 机读键 → `process.env[NEXT_PUBLIC_*]`
 * 2. 构建期 `NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP(_POSTER)`
 * 3. `public/media/traveltrust/*` tier-1 默认（仅当无 env 配置）
 */
export function resolveHeroMediaUrls(brief: TravelTrustPageBrief | null): HeroMediaResolution {
  const loopEnvKey = brief?.media?.hero_loop_env?.trim() || "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP";
  const posterEnvKey =
    brief?.media?.hero_loop_poster_env?.trim() || "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP_POSTER";
  const fromBrief = resolveHeroMediaFromBrief(brief);
  const envMp4 = TRAVELTRUST_HERO_LOOP_MP4.trim();
  const envPoster = TRAVELTRUST_HERO_LOOP_POSTER.trim();
  const productionMp4 = fromBrief.mp4 || envMp4;
  const mp4 = productionMp4 || TRAVELTRUST_HERO_DEFAULT_LOOP;
  const poster = fromBrief.poster || envPoster || TRAVELTRUST_HERO_DEFAULT_POSTER;
  const tier = resolveMediaTier(Boolean(productionMp4));
  return { mp4, poster, tier, loopEnvKey, posterEnvKey };
}

function resolveRoleMp4EnvKey(role: TravelTrustRoleConfig, brief: TravelTrustPageBrief | null): string | null {
  const keys = brief?.media?.role_video_env_keys;
  if (!keys?.length) return role.envMp4 ? "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO" : null;
  const idx = ROLE_BRIEF_VIDEO_INDEX[role.id];
  return keys[idx]?.trim() || null;
}

/**
 * 角色视频解析链（与 Hero 同源）：brief env → role.envMp4 → defaultMp4
 */
export function resolveRoleMediaUrls(
  role: TravelTrustRoleConfig,
  brief: TravelTrustPageBrief | null,
): RoleMediaResolution {
  const base = resolveRoleMedia(role);
  const mp4EnvKey = resolveRoleMp4EnvKey(role, brief);
  const mp4FromBriefEnv = mp4EnvKey ? readTraveltrustPublicEnv(mp4EnvKey) : "";
  const productionMp4 = mp4FromBriefEnv || role.envMp4?.trim() || "";
  const mp4 = productionMp4 || role.defaultMp4;
  const tier = resolveMediaTier(Boolean(productionMp4));
  const webmKey = mp4EnvKey?.replace(/_VIDEO_/, "_WEBM_");
  const webm = webmKey && webmKey !== mp4EnvKey ? readTraveltrustPublicEnv(webmKey) : "";
  const posterEnvKey = role.envPoster
    ? `NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_${role.id.toUpperCase()}`
    : null;
  return {
    roleId: role.id,
    mp4,
    webm,
    poster: base.poster,
    tier,
    mp4EnvKey,
    posterEnvKey,
  };
}

/** layout prefetch：同 MP4 只预取一次（多角色可共用 tier-1 占位路径） */
export function uniqueRoleVideoPrefetchEntries(
  roles: RoleMediaResolution[],
): RoleMediaResolution[] {
  const seen = new Set<string>();
  const out: RoleMediaResolution[] = [];
  for (const role of roles) {
    const href = role.mp4?.trim();
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push(role);
  }
  return out;
}

/** @deprecated 使用 resolveRoleMediaUrls */
export function resolveRoleMediaFromBrief(role: TravelTrustRoleConfig, brief: TravelTrustPageBrief | null) {
  const r = resolveRoleMediaUrls(role, brief);
  return { mp4: r.mp4, webm: r.webm, poster: r.poster };
}

/** 空闲预取：五角色默认/生产 MP4 路径（①） */
export function resolveAllRoleMediaUrls(brief: TravelTrustPageBrief | null): RoleMediaResolution[] {
  return TRAVELTRUST_ROLES.map((role) => resolveRoleMediaUrls(role, brief));
}
