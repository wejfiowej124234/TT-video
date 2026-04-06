import type { CommunityPostType } from "@/lib/communityMockData";

export interface PublishPayload {
  type: CommunityPostType;
  content: string;
  mediaUrls?: string[];
  /** 视频帖可选；与 API `cover_url` 一致（HTTP(S) 图片地址） */
  coverUrl?: string;
}

export interface PublishDrawerProps {
  onClose: () => void;
  onSubmit: (payload: PublishPayload) => void | Promise<void>;
  t: (key: string) => string;
  publishError?: boolean;
  /** API `message` 映射后的文案；优先于默认失败句 */
  publishErrorMessage?: string | null;
  /** 后端 `errors` 已映射：`body` / `media_urls` */
  publishFieldMessages?: Record<string, string> | null;
  onRetryPublish?: () => void;
}
