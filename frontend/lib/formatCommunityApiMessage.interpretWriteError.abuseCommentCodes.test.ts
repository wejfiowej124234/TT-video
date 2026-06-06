import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import { interpretCommunityWriteError } from "./formatCommunityApiMessage";
import { COMMUNITY_COMMENT_SEND_I18N_FALLBACK } from "./communityDrawerCommentSend";

describe("interpretCommunityWriteError · B-056 comment abuse codes", () => {
  /** B-056 / community.rs `response_community_abuse`：429 体含 `errors.body` 与根级 `error` 同码 */
  it.each(["comment_rate_limited", "comment_too_fast", "comment_duplicate"] as const)(
    "maps comment abuse code %s to locale community_api_msg_* (field + root)",
    (code) => {
      const dict = zh as Record<string, string>;
      const tZh = (k: string) => dict[k] ?? k;
      const expected = dict[`community_api_msg_${code}`];
      expect(expected?.trim().length).toBeGreaterThan(0);
      const payload = {
        status: "error",
        error: code,
        message: code,
        errors: { body: code },
      };
      const r = interpretCommunityWriteError(payload, tZh, COMMUNITY_COMMENT_SEND_I18N_FALLBACK);
      expect(r.fieldMessages.body).toBe(expected);
      expect(r.topMessage).toBe(expected);
    }
  );
});
