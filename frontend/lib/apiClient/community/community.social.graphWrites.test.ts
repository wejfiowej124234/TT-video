/**
 * 社区关注/好友写操作与收藏（与 `community.social.dm.test` / `community.social.graphReads.test` 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  postUserFollow,
  deleteUserFollow,
  postFriendsRequest,
  postFriendsAccept,
  postFriendsReject,
  postCollect,
  deleteCollect,
} from ".";
import {
  COMMUNITY_SOCIAL_TEST_POST_ID as postId,
  COMMUNITY_SOCIAL_TEST_USER_ID as uid,
} from "./community.social.testShared";

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

  it("postFriendsRequest returns error envelope when only message is unauthorized (communityWriteJsonBody)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "error", message: "unauthorized" }),
    });
    const out = await postFriendsRequest(uid);
    expect(out).toMatchObject({ status: "error", message: "unauthorized" });
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
