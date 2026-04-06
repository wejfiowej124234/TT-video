/**
 * 社区话题统计、举报申诉（与 community.test 互补）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import { getPublicPostsByTagCount, postCommunityReportAppeal } from "./community";

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

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", message: "invalid_tag" })
    );
    await expect(getPublicPostsByTagCount("x")).rejects.toThrow();
  });
});

describe("postCommunityReportAppeal", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

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
