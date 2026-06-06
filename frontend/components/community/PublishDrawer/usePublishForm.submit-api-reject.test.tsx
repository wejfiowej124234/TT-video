import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommunityPublishSubmitRejectedError } from "@/lib/communityPublishSubmitError";
import { usePublishForm } from "./usePublishForm";

const t = (key: string) => key;

describe("usePublishForm · API rejection does not pollute uploadError", () => {
  it("keeps uploadError null when onSubmit throws CommunityPublishSubmitRejectedError", async () => {
    const onSubmit = vi.fn(async () => {
      throw new CommunityPublishSubmitRejectedError();
    });
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      usePublishForm({
        onClose,
        onSubmit,
        t,
      }),
    );

    act(() => {
      result.current.setType("text");
      result.current.setContent("unique-body-for-test");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalled();
    expect(result.current.uploadError).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
