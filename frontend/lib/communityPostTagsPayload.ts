import {
  COMMUNITY_POST_TAGS_MAX_COUNT,
  communityPostTagExceedsServerUtf8Limit,
} from "@/lib/apiClient/community/constants";

export type NormalizeCommunityPostTagsResult =
  | { ok: true; tags: string[] }
  | { ok: false; code: "tag_too_long" | "tags_too_many" };

/**
 * 与 **`crates/api/src/routes/community/posts/types.rs`** **`normalize_post_tags_for_create`** 同源：
 * trim、去重（保留顺序）、单条 UTF-8 长度、条数上限。
 */
export function normalizeCommunityPostTagsForApi(raw: readonly string[]): NormalizeCommunityPostTagsResult {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    const t = s.trim();
    if (!t) continue;
    if (communityPostTagExceedsServerUtf8Limit(t)) {
      return { ok: false, code: "tag_too_long" };
    }
    if (seen.has(t)) continue;
    if (out.length >= COMMUNITY_POST_TAGS_MAX_COUNT) {
      return { ok: false, code: "tags_too_many" };
    }
    seen.add(t);
    out.push(t);
  }
  return { ok: true, tags: out };
}

/**
 * 发帖弹窗话题输入：支持 **`,` / `，` / `;` / 换行** 与段内**空白**分词；去掉每项前导 **`#`**。
 */
export function splitCommunityPostTagsInput(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  const segments = s.split(/[,，;；\n\r]+/);
  const tokens: string[] = [];
  for (const seg of segments) {
    const parts = seg.trim().split(/\s+/).filter(Boolean);
    tokens.push(...parts);
  }
  return tokens
    .map((p) => {
      let x = p.trim();
      if (x.startsWith("#")) x = x.slice(1).trim();
      return x;
    })
    .filter((x) => x.length > 0);
}
