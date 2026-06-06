/**
 * TT 社区发帖：`usePublishForm`（媒体/upload）与 `useCommunityFeedPublishSubmit`（API/策略）
 * 之间的可预期拒绝码。Upload 阶段勿将 API/策略拒绝误写入 `uploadError`。
 */

export const COMMUNITY_PUBLISH_SUBMIT_REJECTED = "publish_post_not_ok" as const;
export const COMMUNITY_PUBLISH_OFFLINE = "publish_offline" as const;
export const COMMUNITY_PUBLISH_MISSING_MEDIA = "publish_missing_media" as const;
export const COMMUNITY_PUBLISH_MEDIA_POLICY = "publish_media_policy" as const;
export const COMMUNITY_PUBLISH_COVER_POLICY = "publish_cover_policy" as const;

const PARENT_OWNED_PUBLISH_ERRORS = new Set<string>([
  COMMUNITY_PUBLISH_SUBMIT_REJECTED,
  COMMUNITY_PUBLISH_OFFLINE,
  COMMUNITY_PUBLISH_MISSING_MEDIA,
  COMMUNITY_PUBLISH_MEDIA_POLICY,
  COMMUNITY_PUBLISH_COVER_POLICY,
]);

export class CommunityPublishSubmitRejectedError extends Error {
  readonly code = COMMUNITY_PUBLISH_SUBMIT_REJECTED;

  constructor() {
    super(COMMUNITY_PUBLISH_SUBMIT_REJECTED);
    this.name = "CommunityPublishSubmitRejectedError";
  }
}

/** API/策略/离线等：父级已写入 `publishErrorMessage` / `publishFieldMessages`，勿污染 upload 区。 */
export function isCommunityPublishParentOwnedError(err: unknown): boolean {
  if (err instanceof CommunityPublishSubmitRejectedError) return true;
  if (err instanceof Error && PARENT_OWNED_PUBLISH_ERRORS.has(err.message)) return true;
  return false;
}
