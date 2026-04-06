/**
 * 社区私信、关注、好友、收藏（与 community.test / community.posts.test 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  getConversations,
  getConversationMessages,
  postConversationMessage,
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getFriendsRequests,
  getFriendsRequestsSent,
  getMeLikesReceived,
  postUserFollow,
  deleteUserFollow,
  postFriendsRequest,
  postFriendsAccept,
  postFriendsReject,
  getMeCollects,
  postCollect,
  deleteCollect,
} from "./community";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

const uid = "550e8400-e29b-41d4-a716-446655440000";
const convId = "550e8400-e29b-41d4-a716-446655440001";
const postId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

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
    await expect(getConversations()).rejects.toThrow();
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

describe("follow / friends / likes GETs", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("getMeFollowing", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", following: [{ id: uid }] })
    );
    const out = await getMeFollowing();
    expect(out.following).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.meFollowing), expect.any(Object));
  });

  it("getMeFollowers", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", followers: [] })
    );
    await getMeFollowers();
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.meFollowers), expect.any(Object));
  });

  it("getFriendsList", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", friends: [] })
    );
    await getFriendsList();
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.friendsList), expect.any(Object));
  });

  it("getFriendsRequests", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", requests: [] })
    );
    await getFriendsRequests();
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.friendsRequests), expect.any(Object));
  });

  it("getFriendsRequestsSent", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", requests: [] })
    );
    await getFriendsRequestsSent();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.friendsRequestsSent),
      expect.any(Object)
    );
  });

  it("getMeLikesReceived", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", likes_received: 7 })
    );
    const out = await getMeLikesReceived();
    expect(out.likes_received).toBe(7);
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.meLikesReceived), expect.any(Object));
  });

  it("getMeCollects", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", collects: [] })
    );
    await getMeCollects();
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.meCollects), expect.any(Object));
  });
});

describe("follow / friends writes", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("postUserFollow POSTs", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postUserFollow(uid);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.userFollow(uid)),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deleteUserFollow DELETEs", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await deleteUserFollow(uid);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.userFollow(uid)),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("postFriendsRequest POSTs user_id", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postFriendsRequest(uid);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.friendsRequest),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ user_id: uid }),
      })
    );
  });

  it("postFriendsAccept POSTs request_id", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postFriendsAccept("req-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.friendsAccept),
      expect.objectContaining({
        body: JSON.stringify({ request_id: "req-1" }),
      })
    );
  });

  it("postFriendsReject POSTs request_id", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postFriendsReject("req-2");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.friendsReject),
      expect.objectContaining({
        body: JSON.stringify({ request_id: "req-2" }),
      })
    );
  });
});

describe("collect", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("postCollect POSTs", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postCollect(postId);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postCollect(postId)),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deleteCollect DELETEs", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await deleteCollect(postId);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.postCollect(postId)),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
