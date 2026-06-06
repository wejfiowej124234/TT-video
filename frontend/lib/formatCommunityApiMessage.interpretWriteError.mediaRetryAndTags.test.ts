import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import { COMMUNITY_FEED_TAG_QUERY_MAX_LEN } from "@/lib/apiClient/community";
import { interpretCommunityWriteError } from "./formatCommunityApiMessage";
import { formatCommunityApiMessageTestT as t } from "./formatCommunityApiMessage.vitestShared";
import { applyLocalePlaceholders, type LocaleTranslateFn } from "./i18n";

describe("interpretCommunityWriteError · media limits, retry-after & tags", () => {
  it("file_too_large with max_bytes uses localized limit line (zh)", () => {
    const dict = zh as Record<string, string>;
    const tZh = (k: string) => dict[k] ?? k;
    const r = interpretCommunityWriteError(
      { status: "error", error: "file_too_large", message: "file_too_large", max_bytes: 524_288 },
      tZh,
      "fb"
    );
    expect(r.topMessage).toContain("0.5");
    expect(r.topMessage).toMatch(/MB/);
  });

  it("video_too_long with max_duration_sec uses localized limit line (zh)", () => {
    const dict = zh as Record<string, string>;
    const tZh = (k: string) => dict[k] ?? k;
    const r = interpretCommunityWriteError(
      {
        status: "error",
        error: "video_too_long",
        message: "video_too_long",
        max_duration_sec: 180,
      },
      tZh,
      "fb"
    );
    expect(r.topMessage).toContain("180");
  });

  it("retry_after_sec appends countdown suffix for any error (zh)", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    const r = interpretCommunityWriteError(
      {
        status: "error",
        error: "comment_rate_limited",
        message: "comment_rate_limited",
        retry_after_sec: 15,
      },
      tZh,
      "fb"
    );
    expect(r.topMessage).toContain(dict.community_api_msg_comment_rate_limited);
    expect(r.topMessage).toContain("15");
    expect(r.topMessage).toMatch(/秒后再试/);
  });

  it("retry_after_sec appends for non-abuse machine codes when header merged (zh)", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    const r = interpretCommunityWriteError(
      {
        status: "error",
        error: "like_create_failed",
        message: "like_create_failed",
        retry_after_sec: 3,
      },
      tZh,
      "fb"
    );
    expect(r.topMessage).toContain("3");
    expect(r.topMessage).toMatch(/秒后再试/);
  });

  it("retry_after_seconds (global rate limit JSON) appends suffix like retry_after_sec (zh)", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    const r = interpretCommunityWriteError(
      {
        status: "error",
        error: "rate_limit_exceeded",
        message: "rate_limit_exceeded",
        retry_after_seconds: 60,
      },
      tZh,
      "fb"
    );
    expect(r.topMessage).toContain("60");
    expect(r.topMessage).toMatch(/秒后再试/);
  });

  it("prefers retry_after_sec over retry_after_seconds on envelope", () => {
    const dict = en as Record<string, string>;
    const tEn: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    const r = interpretCommunityWriteError(
      {
        status: "error",
        error: "post_rate_limited",
        message: "post_rate_limited",
        retry_after_sec: 5,
        retry_after_seconds: 99,
      },
      tEn,
      "fb"
    );
    expect(r.topMessage).toContain("5");
    expect(r.topMessage).not.toContain("99");
  });

  it("errors.tags tag_too_long interpolates max (zh)", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    const r = interpretCommunityWriteError(
      { status: "error", error: "tag_too_long", errors: { tags: "tag_too_long" } },
      tZh,
      "fb"
    );
    const expected = `标签过长（单条最多 ${COMMUNITY_FEED_TAG_QUERY_MAX_LEN} UTF-8 字节）。`;
    expect(r.fieldMessages.tags).toBe(expected);
    expect(r.topMessage).toBe(expected);
  });
});
