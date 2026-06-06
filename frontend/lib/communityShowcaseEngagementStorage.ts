/**
 * ① 本地 showcase 帖赞/藏 · localStorage（本机保留；非 API 写回）
 */
import { isShowcasePostId } from "@/lib/communityShowcase";

const LIKED_KEY = "tt-community-showcase-liked";
const COLLECTED_KEY = "tt-community-showcase-collected";

function readIds(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && isShowcasePostId(id)));
  } catch {
    return new Set();
  }
}

function writeIds(key: string, ids: Iterable<string>) {
  if (typeof window === "undefined") return;
  try {
    const showcaseOnly = [...ids].filter(isShowcasePostId);
    window.localStorage.setItem(key, JSON.stringify(showcaseOnly));
  } catch {
    /* ignore quota */
  }
}

export function loadShowcaseEngagementSets(): { liked: Set<string>; collected: Set<string> } {
  return { liked: readIds(LIKED_KEY), collected: readIds(COLLECTED_KEY) };
}

export function persistShowcaseLikedIds(ids: ReadonlySet<string>) {
  writeIds(LIKED_KEY, ids);
}

export function persistShowcaseCollectedIds(ids: ReadonlySet<string>) {
  writeIds(COLLECTED_KEY, ids);
}
