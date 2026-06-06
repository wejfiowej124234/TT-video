import type { MutableRefObject } from "react";
import type { CommunityPost } from "@/lib/communityMockData";
import { warmCommunityPostDetailDrawer } from "@/lib/communityDrawerPrefetch";

/** 社区子页统一：评论/查看 → PostDetailDrawer（P1-03 · ①） */
export function communityOpenPostDetail(args: {
  post: CommunityPost;
  trigger?: HTMLElement | null;
  focusComments?: boolean;
  focusReturnTargetRef: MutableRefObject<HTMLElement | null>;
  setDetailFocusComments: (v: boolean) => void;
  setCommentPost: (p: CommunityPost | null) => void;
  setDetailPost: (p: CommunityPost | null) => void;
}) {
  warmCommunityPostDetailDrawer();
  args.focusReturnTargetRef.current = args.trigger ?? null;
  args.setDetailFocusComments(args.focusComments ?? false);
  args.setCommentPost(null);
  args.setDetailPost(args.post);
}
