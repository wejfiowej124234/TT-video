import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import type { UserShape } from "@/components/me/constants";
import { isCommunityMeBioEnabled } from "@/lib/communityMeFeatureFlags";

export type ProfileWalletDisplayKind = "saved" | "connected_unsaved" | "empty";

export type ProfileWalletDisplay = {
  displayText: string;
  kind: ProfileWalletDisplayKind;
  savedAddress?: string;
  connectedAddress?: string;
};

/** 资料页钱包展示：已保存 > 顶栏已连接未写入 > 未设置 */
export function resolveProfileWalletDisplay(
  t: (key: string, params?: Record<string, string>) => string,
  saved?: string | null,
  connected?: string | null,
): ProfileWalletDisplay {
  const savedTrim = saved?.trim() ?? "";
  if (savedTrim) {
    return {
      displayText: formatWalletOrDidShort(savedTrim) ?? savedTrim,
      kind: "saved",
      savedAddress: savedTrim,
    };
  }
  const connTrim = connected?.trim() ?? "";
  if (connTrim) {
    const short = formatWalletOrDidShort(connTrim) ?? connTrim;
    return {
      displayText: t("me_settings_profile_wallet_connected_unsaved", { wallet: short }),
      kind: "connected_unsaved",
      connectedAddress: connTrim,
    };
  }
  return { displayText: t("me_notSet"), kind: "empty" };
}

export type ProfileCompletenessItem = "avatar" | "nickname" | "bio" | "wallet";

export function profileCompletenessItems(user: UserShape, bioEnabled: boolean): ProfileCompletenessItem[] {
  const items: ProfileCompletenessItem[] = [];
  if (user.avatar_url?.trim()) items.push("avatar");
  if (user.nickname?.trim()) items.push("nickname");
  if (bioEnabled && typeof user.bio === "string" && user.bio.trim()) items.push("bio");
  if (user.default_wallet_address?.trim()) items.push("wallet");
  return items;
}

export function profileCompletenessTotal(bioEnabled: boolean): number {
  return bioEnabled ? 4 : 3;
}

export function profileCompletenessPercent(user: UserShape, bioEnabled = isCommunityMeBioEnabled()): number {
  const total = profileCompletenessTotal(bioEnabled);
  const done = profileCompletenessItems(user, bioEnabled).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
