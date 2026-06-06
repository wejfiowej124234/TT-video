import { describe, expect, it } from "vitest";
import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  COMMUNITY_POST_TAGS_MAX_COUNT,
} from "@/lib/apiClient/community/constants";
import {
  normalizeCommunityPostTagsForApi,
  splitCommunityPostTagsInput,
} from "./communityPostTagsPayload";

describe("communityPostTagsPayload", () => {
  it("split strips hash and splits on comma and space", () => {
    expect(splitCommunityPostTagsInput("  #foo , bar  baz ")).toEqual(["foo", "bar", "baz"]);
  });

  it("normalize matches server ordering and caps", () => {
    const long = "z".repeat(COMMUNITY_FEED_TAG_QUERY_MAX_LEN + 1);
    expect(normalizeCommunityPostTagsForApi([long])).toEqual({ ok: false, code: "tag_too_long" });
    const many = Array.from({ length: COMMUNITY_POST_TAGS_MAX_COUNT + 1 }, (_, i) => `t${i}`);
    expect(normalizeCommunityPostTagsForApi(many)).toEqual({ ok: false, code: "tags_too_many" });
    expect(normalizeCommunityPostTagsForApi(["a", "a", "b"])).toEqual({ ok: true, tags: ["a", "b"] });
  });

  it("normalize uses UTF-8 byte length (aligns with Rust str::len)", () => {
    const okCjk = "中".repeat(21);
    expect(normalizeCommunityPostTagsForApi([okCjk])).toEqual({ ok: true, tags: [okCjk] });
    const tooLongCjk = "中".repeat(22);
    expect(normalizeCommunityPostTagsForApi([tooLongCjk])).toEqual({ ok: false, code: "tag_too_long" });
  });
});
