/**

 * **51-31-2**：`handleVideoChange` 通过 **`probeCommunityPublishVideoBlob`**（内部

 * **`HTMLVideoElement.duration`**）与 **`GET …/media/capabilities`** 返回的

 * **`max_video_seconds`** 对齐的闸。

 *

 * ---

 * **运行时契约（与 `usePublishForm` / `publishFormVideoBlobProbe` 对拍）**

 *

 * 1. **`uploadError`（最终 UI 展示类型）**

 *    - Hook 内为 **`string | null`**（`useState<string | null>`）。

 *    - 组件层（如 `PublishDrawerVideoSection`）将非空值作为 **已本地化文案** 直接渲染

 *      （`{form.uploadError}`）；即运行时应为 **`t(key)` 的返回值**（可能含 `{{max}}` 等

 *      已替换片段），**不是** Error 对象。

 *

 * 2. **`videoPreviewUrl`（`blob:` URL 生命周期）**

 *    - 仅在校验通过时由 **`probeCommunityPublishVideoBlob`** 保留其内部

 *      **`URL.createObjectURL(file)`** 的返回值（`ok: true` 时 `objectUrl`）。

 *    - 用户换视频时 `setVideoPreviewUrl` 会先 **`URL.revokeObjectURL(prev)`**；

 *      `removeVideo` / 提交成功 / 失败路径亦按 `blob:` 前缀撤销。

 *    - 校验失败（含时长超限）时 probe 在返回前 **`URL.revokeObjectURL(url)`**，

 *      **`videoPreviewUrl` 不会被设为该 URL**（保持 `null` 或旧值）。

 *

 * 3. **时长 `> max_video_seconds`（后端能力上限；默认常数见 `MAX_VIDEO_DURATION_SEC`）**

 *    - `probeCommunityPublishVideoBlob` 在 `onloadedmetadata` 中若

 *      `dur > maxVideoDurationSec` 则 **`ok: false`**，

 *      **`errorMessage` = `t("community_upload_error_video_duration")` 替换 `{{max}}`**。

 *    - `handleVideoChange` 将 **`setUploadError(r.errorMessage)`**，不设预览 URL。

 *

 * 4. **`multipart_enabled === false`（与后端 `media_capabilities.rs` 同源）**

 *    - 后端 **`public_video_publish_ready = multipart_enabled && HeadBucket_ok`**。

 *    - 当 **`public_video_publish_ready === false`** 时，`handleVideoChange` **不进入**

 *      probe：直接 **`setUploadError(t("community_object_storage_video_unavailable_banner"))`**

 *      并清空 input；**无** `blob:` 预览。

 *

 * 不启真实解码器；**`document.createElement("video")`** 注入轻量桩。

 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

import { renderHook, waitFor, act } from "@testing-library/react";

import type { ChangeEvent } from "react";

import { usePublishForm } from "./usePublishForm";

import { MAX_VIDEO_DURATION_SEC } from "./constants";

import type { CommunityMediaCapabilities } from "@/lib/apiClient/community/mediaCapabilities";



const { mockGetCommunityMediaCapabilities } = vi.hoisted(() => ({

  mockGetCommunityMediaCapabilities: vi.fn(),

}));



vi.mock("@/lib/apiClient/community/mediaCapabilities", () => ({

  getCommunityMediaCapabilities: mockGetCommunityMediaCapabilities,

}));



function readyCapabilities(overrides: Partial<CommunityMediaCapabilities> = {}): CommunityMediaCapabilities {

  return {

    status: "ok",

    multipart_enabled: true,

    public_video_publish_ready: true,

    public_video_spec_required: false,

    head_bucket_probe_impl: "head_bucket_cached_ttl15s_v1",

    head_bucket_cache_hit: false,

    public_video_publish_error: null,

    max_video_seconds: MAX_VIDEO_DURATION_SEC,

    max_video_bytes: 64 * 1024 * 1024,

    supported_content_types: ["video/mp4", "video/webm"],

    ...overrides,

  };

}



describe("usePublishForm · video metadata duration", () => {

  const t = (k: string) => k;

  const origCreate = document.createElement.bind(document);



  afterEach(() => {

    vi.unstubAllGlobals();

    vi.restoreAllMocks();

  });



  beforeEach(() => {

    mockGetCommunityMediaCapabilities.mockReset();

    mockGetCommunityMediaCapabilities.mockResolvedValue(readyCapabilities());

    const Native = URL;

    vi.stubGlobal(

      "URL",

      class MockURL extends Native {

        static override createObjectURL = () => "blob:mock-video-url";

        static override revokeObjectURL = () => {};

      } as unknown as typeof URL,

    );

  });



  function stubVideoElement(duration: number) {

    let _src = "";

    const fake = {

      preload: "",

      duration,

      get src() {

        return _src;

      },

      set src(v: string) {

        _src = v;

        queueMicrotask(() => fake.onloadedmetadata?.());

      },

      onloadedmetadata: null as null | (() => void),

      onerror: null as null | (() => void),

      removeAttribute: vi.fn(),

    };

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {

      if (tag === "video") return fake as unknown as HTMLVideoElement;

      return origCreate(tag);

    });

    return fake;

  }



  async function waitForPublishPipelineReady(result: { current: ReturnType<typeof usePublishForm> }) {

    await waitFor(() => {

      expect(result.current.videoPublishPipelineReady).toBe(true);

    });

  }



  it("sets uploadError when duration exceeds MAX_VIDEO_DURATION_SEC", async () => {

    stubVideoElement(MAX_VIDEO_DURATION_SEC + 1);

    const onClose = vi.fn();

    const onSubmit = vi.fn();

    const { result } = renderHook(() => usePublishForm({ onClose, onSubmit, t }));



    await waitForPublishPipelineReady(result);



    const input = document.createElement("input");

    const file = new File([new Uint8Array(1024)], "clip.mp4", { type: "video/mp4" });

    Object.defineProperty(input, "files", { value: [file], configurable: true });



    await act(async () => {

      result.current.handleVideoChange({ target: input } as unknown as ChangeEvent<HTMLInputElement>);

    });



    await waitFor(() => {

      expect(result.current.uploadError).toContain("community_upload_error_video_duration");

    });

    expect(result.current.videoPreviewUrl).toBeNull();

  });



  it("accepts video at exactly MAX_VIDEO_DURATION_SEC", async () => {

    stubVideoElement(MAX_VIDEO_DURATION_SEC);

    const onClose = vi.fn();

    const onSubmit = vi.fn();

    const { result } = renderHook(() => usePublishForm({ onClose, onSubmit, t }));



    await waitForPublishPipelineReady(result);



    const input = document.createElement("input");

    const file = new File([new Uint8Array(1024)], "ok.mp4", { type: "video/mp4" });

    Object.defineProperty(input, "files", { value: [file], configurable: true });



    await act(async () => {

      result.current.handleVideoChange({ target: input } as unknown as ChangeEvent<HTMLInputElement>);

    });



    await waitFor(() => {

      expect(result.current.uploadError).toBeNull();

      expect(result.current.videoPreviewUrl).toMatch(/^blob:/);

    });

  });



  it("rejects video pick with banner when multipart pipeline is off (public_video_publish_ready false)", async () => {

    mockGetCommunityMediaCapabilities.mockResolvedValue(

      readyCapabilities({

        multipart_enabled: false,

        public_video_publish_ready: false,

        public_video_publish_error: "community_media_object_storage_not_configured",

        max_video_seconds: 0,

        max_video_bytes: 512,

      }),

    );

    stubVideoElement(5);

    const onClose = vi.fn();

    const onSubmit = vi.fn();

    const { result } = renderHook(() => usePublishForm({ onClose, onSubmit, t }));



    await waitFor(() => {

      expect(result.current.objectStorageVideoBanner).toBe("community_object_storage_video_unavailable_banner");

    });



    const input = document.createElement("input");

    const file = new File([new Uint8Array(1024)], "blocked.mp4", { type: "video/mp4" });

    Object.defineProperty(input, "files", { value: [file], configurable: true });



    await act(async () => {

      result.current.handleVideoChange({ target: input } as unknown as ChangeEvent<HTMLInputElement>);

    });



    await waitFor(() => {

      expect(result.current.uploadError).toBe("community_object_storage_video_unavailable_banner");

    });

    expect(result.current.videoPreviewUrl).toBeNull();

  });

});


