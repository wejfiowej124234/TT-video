/**
 * 社区反馈本地暂存（54-S19、localStorage）；可注入 Storage 便于单测。
 */

import type { FeedbackMediaItem } from "./communityFeedbackDisplay";

export const FEEDBACK_LOCAL_KEY = "traveltrust_feedback_local";

export type CommunityFeedbackLocalItem = {
  id: string;
  category: string;
  content: string;
  status?: string;
  official_reply?: string | null;
  created_at: string;
  local?: boolean;
  media?: FeedbackMediaItem[];
};

export function readFeedbackLocalStorage(store: Pick<Storage, "getItem"> | null): CommunityFeedbackLocalItem[] {
  if (!store) return [];
  try {
    const raw = store.getItem(FEEDBACK_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommunityFeedbackLocalItem[];
    return Array.isArray(parsed) ? parsed.filter((x) => x && x.id && x.created_at) : [];
  } catch {
    return [];
  }
}

export function writeFeedbackLocalStorage(
  store: Pick<Storage, "setItem"> | null,
  items: CommunityFeedbackLocalItem[]
): void {
  if (!store) return;
  try {
    const localOnly = items.filter((x) => x.local === true);
    store.setItem(FEEDBACK_LOCAL_KEY, JSON.stringify(localOnly));
  } catch {
    // ignore quota / private mode
  }
}

export function loadFeedbackLocalBrowser(): CommunityFeedbackLocalItem[] {
  if (typeof window === "undefined") return [];
  return readFeedbackLocalStorage(window.localStorage);
}

export function saveFeedbackLocalBrowser(items: CommunityFeedbackLocalItem[]): void {
  if (typeof window === "undefined") return;
  writeFeedbackLocalStorage(window.localStorage, items);
}
