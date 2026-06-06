import { describe, it, expect } from "vitest";
import {
  communityObjectStorageVideoBannerKey,
  communityVideoPublishPipelineReady,
} from "./communityVideoPublishGate";

describe("communityVideoPublishGate", () => {
  it("returns undefined pipeline state until capabilities load", () => {
    expect(communityVideoPublishPipelineReady(false, null)).toBeUndefined();
  });

  it("matches E2E skip when object storage not ready", () => {
    expect(
      communityVideoPublishPipelineReady(true, {
        public_video_publish_ready: false,
        multipart_enabled: false,
        max_video_bytes: 0,
        max_video_seconds: 0,
      })
    ).toBe(false);
    expect(
      communityObjectStorageVideoBannerKey(true, {
        public_video_publish_ready: false,
        multipart_enabled: false,
        max_video_bytes: 0,
        max_video_seconds: 0,
      })
    ).toBe("community_object_storage_video_unavailable_banner");
  });

  it("clears banner when public_video_publish_ready", () => {
    expect(
      communityVideoPublishPipelineReady(true, {
        public_video_publish_ready: true,
        multipart_enabled: true,
        max_video_bytes: 1,
        max_video_seconds: 180,
      })
    ).toBe(true);
    expect(
      communityObjectStorageVideoBannerKey(true, {
        public_video_publish_ready: true,
        multipart_enabled: true,
        max_video_bytes: 1,
        max_video_seconds: 180,
      })
    ).toBeNull();
  });
});
