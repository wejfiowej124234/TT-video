/**
 * 社区私信 DM（与 `community.social.graphReads.test` / `community.social.graphWrites.test` 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { getConversations, getConversationMessages, postConversationMessage } from ".";
import {
  COMMUNITY_SOCIAL_TEST_CONV_ID as convId,
  mockTextResponse,
} from "./community.social.testShared";

describe("DM: getConversations / getConversationMessages", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("getConversations GETs list", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", conversations: [] })
    );
    const out = await getConversations();
    expect(out.conversations).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.conversations), expect.any(Object));
  });

  it("getConversations rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "login_required" })
    );
    await expect(getConversations()).rejects.toThrow("login_required");
  });

  it("getConversations rejects HTTP 200 envelope when only message is unauthorized", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "unauthorized" })
    );
    await expect(getConversations()).rejects.toThrow("unauthorized");
  });

  it("getConversationMessages GETs by id", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", messages: [] })
    );
    await getConversationMessages(convId);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.conversationMessages(convId)),
      expect.any(Object)
    );
  });

  it("getConversationMessages rejects HTTP 200 envelope when only message is unauthorized", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "unauthorized" })
    );
    await expect(getConversationMessages(convId)).rejects.toThrow("unauthorized");
  });
});

describe("postConversationMessage", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("POSTs body JSON", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", id: "m1" }),
    });
    const out = await postConversationMessage(convId, "hello dm");
    expect(out).toEqual({ status: "ok", id: "m1" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.conversationMessages(convId)),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ body: "hello dm" }),
      })
    );
  });
});
