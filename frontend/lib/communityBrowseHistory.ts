/**
 * 社区笔记本地浏览记录（仅浏览器 localStorage；①②③ 同源逻辑，无后端差异）。
 * 用于 `/community/me?tab=posts` 「最近浏览」与快捷入口文案对齐。
 */

const STORAGE_KEY = "traveltrust_community_browse_v1";
const MAX_ENTRIES = 40;

export type CommunityBrowseHistoryEntry = {
  id: string;
  viewedAt: number;
  title?: string;
  preview?: string;
};

function safeParse(raw: string | null): CommunityBrowseHistoryEntry[] {
  if (raw == null || raw.trim() === "") return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: CommunityBrowseHistoryEntry[] = [];
    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id.trim() : "";
      if (!id) continue;
      const viewedAt = typeof o.viewedAt === "number" && Number.isFinite(o.viewedAt) ? o.viewedAt : Date.now();
      const title = typeof o.title === "string" ? o.title.slice(0, 200) : undefined;
      const preview = typeof o.preview === "string" ? o.preview.slice(0, 300) : undefined;
      out.push({ id, viewedAt, title, preview });
    }
    return out;
  } catch {
    return [];
  }
}

export function readCommunityBrowseHistory(): CommunityBrowseHistoryEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

/** 将帖子置于浏览列表最前；同 id 去重。 */
export function recordCommunityPostBrowse(entry: { id: string; title?: string; preview?: string }): void {
  if (typeof window === "undefined") return;
  const id = entry.id.trim();
  if (!id) return;
  const rest = readCommunityBrowseHistory().filter((e) => e.id !== id);
  const title = entry.title?.trim() ? entry.title.trim().slice(0, 200) : undefined;
  const preview = entry.preview?.trim() ? entry.preview.trim().slice(0, 300) : undefined;
  const next: CommunityBrowseHistoryEntry[] = [
    { id, viewedAt: Date.now(), title, preview },
    ...rest,
  ].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function clearCommunityBrowseHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
