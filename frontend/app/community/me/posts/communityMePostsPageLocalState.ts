import type {
  CommunityComment,
  CommunityPost,
  CommunityPostVisibility,
} from "@/lib/communityMockData";

export function mapCommunityMePostsWithVisibility(
  posts: CommunityPost[],
  postId: string,
  next: CommunityPostVisibility
): CommunityPost[] {
  return posts.map((p) => (p.id === postId ? { ...p, visibilityStatus: next } : p));
}

export function mapCommunityMePostRefWithVisibility(
  post: CommunityPost | null,
  postId: string,
  next: CommunityPostVisibility
): CommunityPost | null {
  if (!post) return null;
  return post.id === postId ? { ...post, visibilityStatus: next } : post;
}

export function filterCommunityMePostsExcludingId(
  posts: CommunityPost[],
  postId: string
): CommunityPost[] {
  return posts.filter((p) => p.id !== postId);
}

export function clearCommunityMePostRefIfId(
  post: CommunityPost | null,
  postId: string
): CommunityPost | null {
  return post?.id === postId ? null : post;
}

export function omitCommunityMeCommentsByPostId(
  byId: Record<string, CommunityComment[]>,
  postId: string
): Record<string, CommunityComment[]> {
  const next = { ...byId };
  delete next[postId];
  return next;
}
