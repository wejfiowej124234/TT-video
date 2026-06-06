"use client";

import { shouldUseCommunityShowcaseForRelationalUi } from "@/lib/communityShowcase";

type RelationalShowcaseHintKey =
  | "community_friends_relational_showcase_hint"
  | "community_messages_relational_showcase_hint";

/** ① 本地：关系链空库时可能注入 curated 演示用户/会话（与 Feed showcase 同门闸）。 */
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
    <p id={hintId} className="sr-only">
      {t(hintKey)}
    </p>
  );
}

export function communityRelationalShowcaseDataAttr(): Record<string, string> | undefined {
  if (!shouldUseCommunityShowcaseForRelationalUi()) return undefined;
  return { "data-tt-community-relational-showcase": "active-v1" };
}
