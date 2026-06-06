import type { CommunityPost } from "@/lib/communityMockData";

export type CommunityFeedCardMediaProps = {
  post: CommunityPost;
  images: string[];
  is_video: boolean;
  type: string;
  t: (key: string) => string;
  onDoubleTapLike: () => void;
  onPlayVideo?: (post: CommunityPost, trigger?: HTMLElement) => void;
};
