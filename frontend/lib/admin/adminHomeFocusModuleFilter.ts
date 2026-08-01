import type { AdminHomeCard, AdminHomeInboxKey } from "./adminHomeModel";
import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { rolePrimaryCtaFallback } from "./adminHomePrimaryCtaByRole";
import type { ConsoleRole70 } from "./adminRole70Matrix";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "./useAdminHomeInbox";

const QUEUE_HREF_TO_INBOX_KEY: Record<string, AdminHomeInboxKey> = {
  [ADMIN_INBOX_QUEUE_HREFS.provider]: "provider",
  [ADMIN_INBOX_QUEUE_HREFS.guide]: "guide",
  [ADMIN_INBOX_QUEUE_HREFS.steward]: "steward",
  [ADMIN_INBOX_QUEUE_HREFS.approvals]: "approvals",
  [ADMIN_INBOX_QUEUE_HREFS.reports]: "reports",
};

const COMMUNITY_ADJACENT_PREFIXES = [
  "/admin/community/appeals",
  "/admin/community/moderation",
  "/admin/community/penalties",
  "/admin/community/risk-signals",
] as const;

export function adminHomeInboxKeyForQueueHref(href: string): AdminHomeInboxKey | null {
  return QUEUE_HREF_TO_INBOX_KEY[href] ?? null;
}

function channelHasPending(
  key: AdminHomeInboxKey,
  counts: AdminHomeInboxCounts,
  channels: AdminHomeInboxChannels,
  loading: boolean,
): boolean {
  if (loading) return false;
  if (channels[key]?.permissionDenied) return false;
  const n = counts[key];
  return n !== null && n > 0;
}

function anyOnboardingQueuePending(
  counts: AdminHomeInboxCounts,
  channels: AdminHomeInboxChannels,
  loading: boolean,
): boolean {
  return (["provider", "guide", "steward", "approvals"] as const).some((key) =>
    channelHasPending(key, counts, channels, loading),
  );
}

function reportsQueuePending(
  counts: AdminHomeInboxCounts,
  channels: AdminHomeInboxChannels,
  loading: boolean,
): boolean {
  return channelHasPending("reports", counts, channels, loading);
}

/** ① 有待办聚焦时：仅展示与待办队列 / 角色主 CTA / 社区处置相关的模块卡。 */
export function adminHomeCardVisibleInFocusMode(input: {
  card: AdminHomeCard;
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  loading: boolean;
  consoleRole70: ConsoleRole70 | null;
}): boolean {
  const { card, counts, channels, loading, consoleRole70 } = input;

  if (card.href.startsWith("/admin/permissions")) return true;

  if (card.href === "/admin/inbox") {
    return (["provider", "guide", "steward", "approvals", "reports"] as const).some((key) =>
      channelHasPending(key, counts, channels, loading),
    );
  }

  if (card.inboxKey && channelHasPending(card.inboxKey, counts, channels, loading)) {
    return true;
  }

  const queueKey = adminHomeInboxKeyForQueueHref(card.href);
  if (queueKey && channelHasPending(queueKey, counts, channels, loading)) {
    return true;
  }

  if (card.href === "/admin/onboarding" && anyOnboardingQueuePending(counts, channels, loading)) {
    return true;
  }

  if (reportsQueuePending(counts, channels, loading)) {
    if (COMMUNITY_ADJACENT_PREFIXES.some((prefix) => card.href.startsWith(prefix))) {
      return true;
    }
  }

  for (const cta of rolePrimaryCtaFallback(consoleRole70)) {
    if (cta.href !== card.href) continue;
    const key = adminHomeInboxKeyForQueueHref(cta.href);
    if (key && channelHasPending(key, counts, channels, loading)) return true;
  }

  return false;
}

export function filterAdminHomeCardsForFocusMode(
  cards: readonly AdminHomeCard[],
  input: Omit<Parameters<typeof adminHomeCardVisibleInFocusMode>[0], "card">,
): AdminHomeCard[] {
  return cards.filter((card) => adminHomeCardVisibleInFocusMode({ ...input, card }));
}
