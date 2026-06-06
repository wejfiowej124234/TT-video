/**
 * ① 本地 showcase 作者关注 · localStorage（仅 `tt-demo-*`；非 API 写回）
 */
import { isShowcaseAuthorId } from "@/lib/communityShowcase";

const FOLLOWING_KEY = "tt-community-showcase-following";

function readIds(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && isShowcaseAuthorId(id)));
  } catch {
    return new Set();
  }
}

function writeIds(key: string, ids: Iterable<string>) {
  if (typeof window === "undefined") return;
  try {
    const showcaseOnly = [...ids].filter(isShowcaseAuthorId);
    window.localStorage.setItem(key, JSON.stringify(showcaseOnly));
  } catch {
    /* ignore quota */
  }
}

export function loadShowcaseFollowIds(): Set<string> {
  return readIds(FOLLOWING_KEY);
}

export function persistShowcaseFollowIds(ids: ReadonlySet<string>) {
  writeIds(FOLLOWING_KEY, ids);
}
