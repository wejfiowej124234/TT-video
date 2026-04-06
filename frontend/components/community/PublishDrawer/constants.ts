import type { CommunityPostType } from "@/lib/communityMockData";

/** 发布类型：照片、视频、纯文字（31 §2.1 P3） */
export const TYPES: CommunityPostType[] = ["photo", "video", "text"];

export const MAX_CHARS = 1000;
export const MAX_IMAGES = 9;
export const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPT_VIDEO = "video/mp4,video/webm";
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;
/** 51-31-2：视频时长上限（秒），如 60s/3min；31 对标 §二 */
export const MAX_VIDEO_DURATION_SEC = 180;
/** 元数据未返回时撤销 blob，避免挂起 */
export const VIDEO_METADATA_TIMEOUT_MS = 8000;
