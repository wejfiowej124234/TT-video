import { describe, expect, it, vi } from "vitest";
import { allSettledInChunks } from "./allSettledInChunks";

describe("allSettledInChunks", () => {
  it("preserves order and caps concurrency", async () => {
    const calls: number[] = [];
    const worker = vi.fn(async (n: number) => {
      calls.push(n);
      await Promise.resolve();
      if (n === 2) throw new Error("fail");
      return n * 10;
    });
    const out = await allSettledInChunks([1, 2, 3, 4], 2, worker);
    expect(worker).toHaveBeenCalledTimes(4);
    expect(out).toHaveLength(4);
    expect(out[0]).toEqual({ status: "fulfilled", value: 10 });
    expect(out[1]).toMatchObject({ status: "rejected" });
    expect(out[2]).toEqual({ status: "fulfilled", value: 30 });
    expect(out[3]).toEqual({ status: "fulfilled", value: 40 });
  });
});
