import { describe, expect, it } from "vitest";
import { messageForCommunityActionResponse } from "./formatCommunityApiMessage";
import { formatCommunityApiMessageTestT as t } from "./formatCommunityApiMessage.vitestShared";

describe("messageForCommunityActionResponse", () => {
  it("null or non-object returns fallback", () => {
    expect(messageForCommunityActionResponse(null, t, "fb")).toBe("FB");
    expect(messageForCommunityActionResponse("x", t, "fb")).toBe("FB");
  });

  it("non-error object returns fallback", () => {
    expect(messageForCommunityActionResponse({ status: "ok" }, t, "fb")).toBe("FB");
  });

  it("error object returns interpreted top message", () => {
    expect(messageForCommunityActionResponse({ status: "error", message: "empty_body" }, t, "fb")).toBe(
      "正文不能为空"
    );
  });
});
