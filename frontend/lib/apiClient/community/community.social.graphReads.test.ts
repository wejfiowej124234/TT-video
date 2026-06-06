/**
 * 社区关注/好友/赞藏 GET（与 `community.social.dm.test` / `community.social.graphWrites.test` 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  getMeFollowing,
  getMeFollowers,
  getFriendsList,
  getFriendsRequests,
  getFriendsRequestsSent,
  getMeLikesReceived,
  getMeCollects,
  getMeLikes,
} from ".";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "../../communityMeDrawerListCaps";
import {
  COMMUNITY_SOCIAL_TEST_USER_ID as uid,
  mockTextResponse,
} from "./community.social.testShared";

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

  it("getMeCollects caps limit query to COMMUNITY_ME_DRAWER_LIST_ID_CAP (LIST_LIMIT)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", collects: [] })
    );
    await getMeCollects({ limit: 9999 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_ME_DRAWER_LIST_ID_CAP}`),
      expect.any(Object)
    );
  });

  it("getMeCollects passes limit when set to drawer cap", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", collects: [] })
    );
    await getMeCollects({ limit: COMMUNITY_ME_DRAWER_LIST_ID_CAP });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_ME_DRAWER_LIST_ID_CAP}`),
      expect.any(Object)
    );
  });

  it("getMeCollects clamps fractional limit to at least 1", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", collects: [] })
    );
    await getMeCollects({ limit: 0.9 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("limit=1"),
      expect.any(Object)
    );
  });

  it("getMeLikes clamps fractional limit to at least 1", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", likes: [] })
    );
    await getMeLikes({ limit: 0.9 });
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("limit=1"), expect.any(Object));
  });

  it("getMeLikes caps limit query to COMMUNITY_ME_DRAWER_LIST_ID_CAP (LIST_LIMIT)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", likes: [] })
    );
    await getMeLikes({ limit: 9999 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_ME_DRAWER_LIST_ID_CAP}`),
      expect.any(Object)
    );
  });

  it("getMeLikes omits limit query when no params", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", likes: [] })
    );
    await getMeLikes();
    expect(globalThis.fetch).toHaveBeenCalledWith(apiUrl(routes.community.meLikes), expect.any(Object));
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toMatch(/[?&]limit=/);
  });

  it("getMeLikes passes limit when set to drawer cap", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", likes: [] })
    );
    await getMeLikes({ limit: COMMUNITY_ME_DRAWER_LIST_ID_CAP });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`limit=${COMMUNITY_ME_DRAWER_LIST_ID_CAP}`),
      expect.any(Object)
    );
  });
});
