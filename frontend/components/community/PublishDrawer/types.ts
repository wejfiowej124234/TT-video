import type { CommunityPostType } from "@/lib/communityMockData";

export interface PublishPayload {
  type: CommunityPostType;
  content: string;
  mediaUrls?: string[];
  /** 视频帖可选；与 API `cover_url` 一致（HTTP(S) 图片地址） */
  coverUrl?: string;
  /** 与 **`POST …/community/posts`** **`tags`** 校验同源 */
  tags?: string[];
  /** 可选目的地（与 API `destination` / Feed 筛选同源） */
  destination?: string;
  /** S3 multipart 视频资产 id；与 **`media_urls[0]`** playback URL 成对 */
  mediaAssetId?: string;
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
