import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import { COMMUNITY_FEED_TAG_QUERY_MAX_LEN, COMMUNITY_POST_TAGS_MAX_COUNT } from "@/lib/apiClient/community";
import { formatCommunityApiMessage, parseCommunityApiErrors } from "./formatCommunityApiMessage";
import { applyLocalePlaceholders, type LocaleTranslateFn } from "./i18n";
import { formatCommunityApiMessageTestT as t } from "./formatCommunityApiMessage.vitestShared";

describe("formatCommunityApiMessage", () => {
  it("uses fallback when code empty", () => {
    expect(formatCommunityApiMessage("", t, "fb")).toBe("FB");
    expect(formatCommunityApiMessage(null, t, "fb")).toBe("FB");
  });

  it("uses localized string when t returns non-identity", () => {
    expect(formatCommunityApiMessage("empty_body", t, "fb")).toBe("正文不能为空");
  });

  it("humanizes unknown codes when no i18n match", () => {
    expect(formatCommunityApiMessage("unknown_code_here", t, "fb")).toBe("unknown code here");
  });

  it("maps request_failed_<HTTP> like order/admin paths (shared requestFailedHttpUserText)", () => {
    expect(formatCommunityApiMessage("request_failed_404", t, "fb")).toBe("common_apiHttpNotFound");
    expect(formatCommunityApiMessage("request_failed_429", t, "fb")).toBe("common_apiRateLimitExceeded");
  });

  it("maps community.rs snake codes via shared mapOrderWriteError when applicable", () => {
    expect(formatCommunityApiMessage("unauthorized", t, "fb")).toBe("order_error_login_required");
    expect(formatCommunityApiMessage("forbidden", t, "fb")).toBe("order_error_forbidden");
    expect(formatCommunityApiMessage("not_found", t, "fb")).toBe("common_apiHttpNotFound");
    expect(formatCommunityApiMessage("content_required", t, "fb")).toBe("order_error_message_content_required");
  });

  it("interpolates tag_too_long and tags_too_many via mapOrderWriteError (not raw community_api_msg_* without vars)", () => {
    const dict = zh as Record<string, string>;
    const tZh: LocaleTranslateFn = (k, vars) => applyLocalePlaceholders(dict[k] ?? k, vars);
    expect(formatCommunityApiMessage("tag_too_long", tZh, "fb")).toBe(
      `标签过长（单条最多 ${COMMUNITY_FEED_TAG_QUERY_MAX_LEN} UTF-8 字节）。`
    );
    expect(formatCommunityApiMessage("tags_too_many", tZh, "fb")).toBe(
      `话题标签过多（最多 ${COMMUNITY_POST_TAGS_MAX_COUNT} 个）。`
    );
  });

  it("normalizes spaced messages to snake_case before chain-off lookup", () => {
    expect(formatCommunityApiMessage("invalid user id", t, "fb")).toBe("common_apiHttpInvalid");
  });

  it("prefers community_api_msg_* over mapOrderWriteError when locale defines the key", () => {
    const tLoc = (k: string) => {
      if (k === "community_api_msg_unauthorized") return "UA_C";
      if (k === "community_api_msg_not_found") return "NF_THREAD";
      if (k === "community_api_msg_invalid_id") return "INV_ID_COMM";
      return t(k);
    };
    expect(formatCommunityApiMessage("unauthorized", tLoc, "fb")).toBe("UA_C");
    expect(formatCommunityApiMessage("not_found", tLoc, "fb")).toBe("NF_THREAD");
    expect(formatCommunityApiMessage("invalid_id", tLoc, "fb")).toBe("INV_ID_COMM");
  });

  it("maps spaced backend phrases via normalization to community_api_msg_*", () => {
    const tSp = (k: string) => {
      if (k === "community_api_msg_not_found_or_forbidden") return "NFOF";
      if (k === "community_api_msg_db_error") return "DBE";
      if (k === "community_api_msg_invalid_visibility_status") return "IVS";
      return k;
    };
    expect(formatCommunityApiMessage("not found or forbidden", tSp, "fb")).toBe("NFOF");
    expect(formatCommunityApiMessage("db error", tSp, "fb")).toBe("DBE");
    expect(formatCommunityApiMessage("invalid visibility_status", tSp, "fb")).toBe("IVS");
  });
});

describe("parseCommunityApiErrors", () => {
  it("returns null for invalid shapes", () => {
    expect(parseCommunityApiErrors(null)).toBeNull();
    expect(parseCommunityApiErrors({})).toBeNull();
    expect(parseCommunityApiErrors({ errors: null })).toBeNull();
    expect(parseCommunityApiErrors({ errors: {} })).toBeNull();
  });

  it("collects string field codes", () => {
    expect(parseCommunityApiErrors({ errors: { content: "empty_body", x: "  " } })).toEqual({
      content: "empty_body",
    });
  });
});
