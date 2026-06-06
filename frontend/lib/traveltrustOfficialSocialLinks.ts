/** `/traveltrust` 页脚官方社媒 — 槽位常驻（参考站金色横排）；`NEXT_PUBLIC_*` 填 https URL 后启用外链 */

export type TraveltrustOfficialSocialPlatform =
  | "github"
  | "youtube"
  | "snapchat"
  | "tiktok"
  | "threads"
  | "instagram"
  | "facebook"
  | "medium"
  | "reddit"
  | "discord"
  | "telegram"
  | "x";

export type TraveltrustOfficialSocialPlatformConfig = {
  platform: TraveltrustOfficialSocialPlatform;
  envKey: string;
  labelKey: `traveltrust_social_${TraveltrustOfficialSocialPlatform}`;
};

/** 展示顺序（与参考页脚金色图标横排一致） */
export const TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS: readonly TraveltrustOfficialSocialPlatformConfig[] = [
  { platform: "github", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_GITHUB_URL", labelKey: "traveltrust_social_github" },
  { platform: "youtube", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_YOUTUBE_URL", labelKey: "traveltrust_social_youtube" },
  {
    platform: "snapchat",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_SNAPCHAT_URL",
    labelKey: "traveltrust_social_snapchat",
  },
  { platform: "tiktok", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_TIKTOK_URL", labelKey: "traveltrust_social_tiktok" },
  { platform: "threads", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_THREADS_URL", labelKey: "traveltrust_social_threads" },
  {
    platform: "instagram",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_INSTAGRAM_URL",
    labelKey: "traveltrust_social_instagram",
  },
  {
    platform: "facebook",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_FACEBOOK_URL",
    labelKey: "traveltrust_social_facebook",
  },
  { platform: "medium", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_MEDIUM_URL", labelKey: "traveltrust_social_medium" },
  { platform: "reddit", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_REDDIT_URL", labelKey: "traveltrust_social_reddit" },
  { platform: "discord", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_DISCORD_URL", labelKey: "traveltrust_social_discord" },
  {
    platform: "telegram",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_TELEGRAM_URL",
    labelKey: "traveltrust_social_telegram",
  },
  { platform: "x", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_X_URL", labelKey: "traveltrust_social_x" },
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

/** 全部外链槽位（无 URL 时 `href` 为 null，UI 显示待配置态） */
export function listTraveltrustOfficialSocialSlots(): TraveltrustOfficialSocialSlot[] {
  return TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS.map(({ platform, envKey, labelKey }) => ({
    platform,
    envKey,
    labelKey,
    href: readHttpsUrl(process.env[envKey]),
  }));
}

/** 已配置且可点击的外链（埋点 / 测试用） */
export function listTraveltrustOfficialSocialLinksActive() {
  return listTraveltrustOfficialSocialSlots().filter(
    (slot): slot is TraveltrustOfficialSocialSlot & { href: string } => slot.href != null,
  );
}
