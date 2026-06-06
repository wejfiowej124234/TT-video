import type { CommunityMediaCapabilities } from "@/lib/apiClient/community/mediaCapabilities";

/** 与 `GET …/media/capabilities` · PublishDrawer 横幅 · PI-1 E2E `test.skip` 同源（①）。 */
export function communityVideoPublishPipelineReady(
  capabilitiesLoaded: boolean,
  caps: CommunityMediaCapabilities | null | undefined
): boolean | undefined {
  if (!capabilitiesLoaded) return undefined;
  return Boolean(caps?.public_video_publish_ready);
}

export function communityObjectStorageVideoBannerKey(
  capabilitiesLoaded: boolean,
  caps: CommunityMediaCapabilities | null | undefined
): "community_object_storage_video_unavailable_banner" | null {
  if (!capabilitiesLoaded || !caps || caps.public_video_publish_ready) return null;
  return "community_object_storage_video_unavailable_banner";
}
