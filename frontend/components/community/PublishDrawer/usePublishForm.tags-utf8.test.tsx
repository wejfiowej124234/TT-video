/**
 * 发帖 **`tags`** 预检与 **`posts.rs`** **`normalize_post_tags_for_create`** 同源：**UTF-8 字节**上限。
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePublishForm } from "./usePublishForm";

vi.mock("@/lib/marketProductCommunityPublish", () => ({
  hasCommunityPublishAuth: () => true,
}));

describe("usePublishForm · tags UTF-8 byte limit", () => {
  const t = (k: string) => k;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("blocks submit when a tag exceeds 64 UTF-8 bytes (JS length can be lower)", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => usePublishForm({ onClose, onSubmit, t }));

    await act(async () => {
      result.current.setType("text");
      result.current.setContent("hello");
      result.current.setTagsInput("中".repeat(22));
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.uploadError).toBe("community_api_msg_tag_too_long");
  });

  it("allows submit at 63 UTF-8 bytes (CJK)", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePublishForm({ onClose, onSubmit, t }));
    const tag = "中".repeat(21);

    await act(async () => {
      result.current.setType("text");
      result.current.setContent("hello");
      result.current.setTagsInput(tag);
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].tags).toEqual([tag]);
  });
});
