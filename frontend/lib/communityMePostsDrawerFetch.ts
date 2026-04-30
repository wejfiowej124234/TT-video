import { getMyPosts } from "@/lib/apiClient/community";
import {
  parseMyPostsPageEnvelope,
  TRAVELTRUST_MY_POSTS_PAGE_CONTRACT_INVALID,
} from "@/lib/communityMeDrawerListContracts";

export const POSTS_SHOWCASE_DRAWER_PAGE_SIZE = 50;
export const POSTS_SHOWCASE_DRAWER_MAX_PAGES = 40;
/** 弹层内分页硬上限（页数 × 每页条数），超过则停止拉取并提示 `truncated` */
export const POSTS_SHOWCASE_DRAWER_MAX_ROWS = POSTS_SHOWCASE_DRAWER_MAX_PAGES * POSTS_SHOWCASE_DRAWER_PAGE_SIZE;

type MePostRow = NonNullable<Awaited<ReturnType<typeof getMyPosts>>["posts"]>[number];

export type FetchAllPostsForCommunityMeDrawerResult = {
  posts: MePostRow[];
  /** 仍有过期外 `next_cursor` 时置 true，提示用户列表未穷尽 */
  truncated: boolean;
};

/**
 * 个人中心「社区帖子」橱窗弹层（`?tab=posts`）：分页拉全量帖子（上限防失控），与 `GET …/me/posts` 游标一致。
 */
export async function fetchAllPostsForCommunityMeDrawer(
  visibility: "all" | "public" | "private" | "archived" = "all",
): Promise<FetchAllPostsForCommunityMeDrawerResult> {
  const acc: MePostRow[] = [];
  let cursor: string | undefined;
  let truncated = false;
  for (let i = 0; i < POSTS_SHOWCASE_DRAWER_MAX_PAGES; i++) {
    const data = await getMyPosts({ limit: POSTS_SHOWCASE_DRAWER_PAGE_SIZE, cursor, visibility });
    const parsed = parseMyPostsPageEnvelope(data);
    if (parsed.kind === "invalid") {
      throw new Error(TRAVELTRUST_MY_POSTS_PAGE_CONTRACT_INVALID);
    }
    const chunk = parsed.value.posts as MePostRow[];
    acc.push(...chunk);
    const next = parsed.value.next_cursor;
    if (!next) break;
    if (i === POSTS_SHOWCASE_DRAWER_MAX_PAGES - 1) {
      truncated = true;
      break;
    }
    cursor = next;
  }
  return { posts: acc, truncated };
}
