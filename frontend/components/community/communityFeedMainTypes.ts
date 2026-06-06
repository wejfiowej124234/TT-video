/** 与 `useCommunityFeedModals` 深链告警态同源（仅类型镜像，避免循环依赖） */
export type CommunityFeedPostDeepLinkAlert =
  | null
  | { kind: "unavailable" }
  | { kind: "load_failed"; message: string };
