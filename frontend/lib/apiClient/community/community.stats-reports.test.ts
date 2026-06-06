/**
 * 社区话题统计、举报申诉（与 community.test 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  getPublicPostsByTagCount,
  postCommunityReportAppeal,
} from ".";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

const reportId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("getPublicPostsByTagCount", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs stats with encoded tag query", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", tag: "京都", post_count: 12 })
    );
    const out = await getPublicPostsByTagCount("京都");
    expect(out.post_count).toBe(12);
    expect(out.tag).toBe("京都");
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe(`${apiUrl(routes.community.statsPostsByTag)}?tag=${encodeURIComponent("京都")}`);
  });

  it("GETs with trimmed tag", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "ok", tag: "京都", post_count: 3 })
    );
    const out = await getPublicPostsByTagCount("  京都  ");
    expect(out.post_count).toBe(3);
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe(`${apiUrl(routes.community.statsPostsByTag)}?tag=${encodeURIComponent("京都")}`);
  });

  it("rejects tag_too_long without fetch when over max length", async () => {
    await expect(
      getPublicPostsByTagCount("y".repeat(COMMUNITY_FEED_TAG_QUERY_MAX_LEN + 1))
    ).rejects.toThrow("tag_too_long");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects tag_too_long when UTF-8 bytes exceed limit (JS length may be smaller)", async () => {
    const tag = "中".repeat(22);
    expect(tag.length).toBeLessThan(COMMUNITY_FEED_TAG_QUERY_MAX_LEN);
    await expect(getPublicPostsByTagCount(tag)).rejects.toThrow("tag_too_long");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects tag_required without fetch when blank after trim", async () => {
    await expect(getPublicPostsByTagCount("   ")).rejects.toThrow("tag_required");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "invalid_tag" })
    );
    await expect(getPublicPostsByTagCount("x")).rejects.toThrow("invalid_tag");
  });

  it("rejects HTTP 200 envelope when only message is db_error (get_public_posts_by_tag_count parity)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "db_error" })
    );
    await expect(getPublicPostsByTagCount("x")).rejects.toThrow("db_error");
  });
});

describe("postCommunityReportAppeal", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("returns error envelope when only message is appeal_body_required (communityWriteJsonBody)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "error", message: "appeal_body_required" }),
    });
    const out = await postCommunityReportAppeal(reportId, "   ");
    expect(out).toMatchObject({ status: "error", message: "appeal_body_required" });
  });

  it("POSTs trimmed body to report appeals URL", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok", report_id: reportId }),
    });
    const out = await postCommunityReportAppeal(reportId, "  please review  ");
    expect(out).toMatchObject({ status: "ok", report_id: reportId });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.reportAppeals(reportId)),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ body: "please review" }),
      })
    );
  });

  it("trims report id in path", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" }),
    });
    await postCommunityReportAppeal(`  ${reportId}  `, "text");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.community.reportAppeals(reportId)),
      expect.any(Object)
    );
  });
});
