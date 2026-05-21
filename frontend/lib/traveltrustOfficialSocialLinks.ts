/** `/traveltrust` 页脚官方社媒 — 槽位常驻；`NEXT_PUBLIC_*` 填 https URL 后自动启用外链 */

export type TraveltrustOfficialSocialPlatform = "douyin" | "x" | "instagram" | "youtube";

export type TraveltrustOfficialSocialPlatformConfig = {
  platform: TraveltrustOfficialSocialPlatform;
  envKey: string;
  labelKey: `traveltrust_social_${TraveltrustOfficialSocialPlatform}`;
};

/** 展示顺序（与 env 键一一对应，便于后续填充） */
export const TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS: readonly TraveltrustOfficialSocialPlatformConfig[] = [
  { platform: "douyin", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_DOUYIN_URL", labelKey: "traveltrust_social_douyin" },
  { platform: "x", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_X_URL", labelKey: "traveltrust_social_x" },
  {
    platform: "instagram",
    envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_INSTAGRAM_URL",
    labelKey: "traveltrust_social_instagram",
  },
  { platform: "youtube", envKey: "NEXT_PUBLIC_TRAVELTRUST_SOCIAL_YOUTUBE_URL", labelKey: "traveltrust_social_youtube" },
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
