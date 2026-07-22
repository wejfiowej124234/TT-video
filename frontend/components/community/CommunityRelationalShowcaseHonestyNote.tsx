"use client";

import { shouldUseCommunityShowcaseForRelationalUi } from "@/lib/communityShowcase";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

type RelationalShowcaseHintKey =
  | "community_friends_relational_showcase_hint"
  | "community_messages_relational_showcase_hint";

/** ① 本地：关系链空库时可能注入 curated 演示用户/会话（与 Feed showcase 同门闸）。可见诚实条（非仅屏幕阅读器）。 */
export function CommunityRelationalShowcaseHonestyNote({
  t,
  hintKey,
}: {
  t: (key: string) => string;
  hintKey: RelationalShowcaseHintKey;
}) {
  if (!shouldUseCommunityShowcaseForRelationalUi()) return null;
  const hintId = `community-relational-showcase-hint-${hintKey}`;
  return (
    <div
      id={hintId}
      className={`${TT_COMMUNITY_DRAWER_L5.postDetailShowcaseHint} mt-2 px-3 py-2 text-meta leading-snug`}
      role="note"
      data-tt-community-relational-showcase="active-v1"
      data-testid="community-relational-showcase-notice"
    >
      <p>{t(hintKey)}</p>
    </div>
  );
}

export function communityRelationalShowcaseDataAttr(): Record<string, string> | undefined {
  if (!shouldUseCommunityShowcaseForRelationalUi()) return undefined;
  return { "data-tt-community-relational-showcase": "active-v1" };
}
