/** 官方社媒页脚 — Owner 给定平台与 URL（可 env 覆盖）；无 URL 的平台不展示 */

export type TraveltrustOfficialSocialPlatform =
  | "instagram"
  | "tiktok"
  | "threads"
  | "medium"
  | "discord"
  | "x";

export type TraveltrustOfficialSocialPlatformConfig = {
  platform: TraveltrustOfficialSocialPlatform;
  envKey: string;
  labelKey: `traveltrust_social_${TraveltrustOfficialSocialPlatform}`;
  /** Owner 书面官方址；env 非空时优先 */
  defaultHref: string;
};

/** 展示顺序（Owner 2026-07-22 · 仅此六席） */
export const TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS: readonly TraveltrustOfficialSocialPlatformConfig[] = [
  {
    platform: "instagram",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_INSTAGRAM_URL",
    labelKey: "traveltrust_social_instagram",
    defaultHref: "https://www.instagram.com/traveltrust.ir/",
  },
  {
    platform: "tiktok",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_TIKTOK_URL",
    labelKey: "traveltrust_social_tiktok",
    defaultHref: "https://www.tiktok.com/@traveltrust_?lang=zh-Hans",
  },
  {
    platform: "threads",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_THREADS_URL",
    labelKey: "traveltrust_social_threads",
    defaultHref: "https://www.threads.com/@traveltrust.ir",
  },
  {
    platform: "medium",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_MEDIUM_URL",
    labelKey: "traveltrust_social_medium",
    defaultHref: "https://medium.com/@traveltrust.ir",
  },
  {
    platform: "discord",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_DISCORD_URL",
    labelKey: "traveltrust_social_discord",
    defaultHref: "https://discord.com/channels/1514266600654639184/1514266603817009274",
  },
  {
    platform: "x",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_X_URL",
    labelKey: "traveltrust_social_x",
    defaultHref: "https://x.com/TravelTrust_",
  },
] as const;

export type TraveltrustOfficialSocialSlot = TraveltrustOfficialSocialPlatformConfig & {
  href: string | null;
};

function readHttpsUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** 外链槽位（env 覆盖 defaultHref；均须 https） */
export function listTraveltrustOfficialSocialSlots(): TraveltrustOfficialSocialSlot[] {
  return TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS.map(({ platform, envKey, labelKey, defaultHref }) => {
    const fromEnv = readHttpsUrl(process.env[envKey]);
    const href = fromEnv ?? readHttpsUrl(defaultHref);
    return { platform, envKey, labelKey, defaultHref, href };
  });
}

/** 已配置且可点击的外链（埋点 / 测试用） */
export function listTraveltrustOfficialSocialLinksActive() {
  return listTraveltrustOfficialSocialSlots().filter(
    (slot): slot is TraveltrustOfficialSocialSlot & { href: string } => slot.href != null,
  );
}
