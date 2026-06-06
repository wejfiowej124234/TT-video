/**
 * Vitest：社区视频 S3 multipart 客户端编排（`mediaAssetsMultipart.ts`）与 **`createPost`** **`media_asset_id`** 载荷。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import { uploadCommunityVideoMultipart } from "./mediaAssetsMultipart";
import { createPost } from "./posts";

function jsonResponse(data: unknown, init?: ResponseInit & { etag?: string }) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (init?.etag) headers.set("etag", init.etag);
  const { etag: _e, ...rest } = init ?? {};
  return new Response(JSON.stringify(data), { status: 200, ...rest, headers });
}

describe("uploadCommunityVideoMultipart", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("uploads one part, completes, and returns playbackUrl", async () => {
    const assetId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const f = new File([new Uint8Array(100)], "t.mp4", { type: "video/mp4" });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          object_key: "k",
          content_type: "video/mp4",
          byte_length: f.size,
          part_size_bytes: 8 * 1024 * 1024,
          part_count: 1,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          parts: [
            {
              part_number: 1,
              url: "https://s3.example/presigned-1",
              headers: { "Content-Length": String(f.size) },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200, headers: { etag: '"etagpart1"' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          state: "ready",
          playback_url: "https://cdn.example/v.mp4",
          byte_length: f.size,
        }),
      );

    const out = await uploadCommunityVideoMultipart(f, { fetchImpl: fetchMock });
    expect(out).toEqual({ assetId, playbackUrl: "https://cdn.example/v.mp4" });
    expect(fetchMock).toHaveBeenCalled();
    const putCall = fetchMock.mock.calls.find((c) => c[0] === "https://s3.example/presigned-1");
    expect(putCall?.[1]?.method).toBe("PUT");
  });

  it("throws CommunityMultipartUploadError when a part PUT fails", async () => {
    const assetId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const f = new File([new Uint8Array(50)], "x.mp4", { type: "video/mp4" });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          object_key: "k",
          content_type: "video/mp4",
          byte_length: f.size,
          part_size_bytes: 8 * 1024 * 1024,
          part_count: 1,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          parts: [{ part_number: 1, url: "https://s3.example/p1", headers: {} }],
        }),
      )
      .mockResolvedValueOnce(new Response("denied", { status: 403 }));

    await expect(uploadCommunityVideoMultipart(f, { fetchImpl: fetchMock })).rejects.toMatchObject({
      code: "part_upload_http_failed",
    });
  });

  it("throws when complete returns multipart_complete_failed", async () => {
    const assetId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const f = new File([new Uint8Array(20)], "y.mp4", { type: "video/mp4" });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          object_key: "k",
          content_type: "video/mp4",
          byte_length: f.size,
          part_size_bytes: 8 * 1024 * 1024,
          part_count: 1,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          parts: [{ part_number: 1, url: "https://s3.example/p1", headers: {} }],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200, headers: { etag: '"e1"' } }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "error",
            error: "multipart_complete_failed",
            message: "multipart_complete_failed",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      );

    await expect(uploadCommunityVideoMultipart(f, { fetchImpl: fetchMock })).rejects.toMatchObject({
      code: "multipart_complete_failed",
    });
  });

  it("polls GET and throws media_asset_failed when asset enters failed", async () => {
    const assetId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const f = new File([new Uint8Array(30)], "z.mp4", { type: "video/mp4" });
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          object_key: "k",
          content_type: "video/mp4",
          byte_length: f.size,
          part_size_bytes: 8 * 1024 * 1024,
          part_count: 1,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          parts: [{ part_number: 1, url: "https://s3.example/p1", headers: {} }],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200, headers: { etag: '"e1"' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset_id: assetId,
          state: "ready",
          playback_url: "",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ok",
          asset: {
            id: assetId,
            state: "failed",
            playback_url: null,
            last_error: "probe_failed",
          },
        }),
      );

    await expect(
      uploadCommunityVideoMultipart(f, { fetchImpl: fetchMock, pollIntervalMs: 1, pollMaxAttempts: 5 }),
    ).rejects.toMatchObject({ code: "media_asset_failed" });
  });
});

describe("createPost · media_asset_id", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("includes media_asset_id in JSON when posting video after multipart", async () => {
    const aid = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", id: "post-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await createPost({
      body: "hello",
      post_type: "video",
      media_urls: ["https://cdn.example/playback.mp4"],
      media_asset_id: aid,
    });
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe(apiUrl(routes.community.posts));
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.media_asset_id).toBe(aid);
    expect(body.post_type).toBe("video");
    expect(body.media_urls).toEqual(["https://cdn.example/playback.mp4"]);
  });
});
