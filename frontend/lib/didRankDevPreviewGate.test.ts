import { describe, expect, it, vi, afterEach } from "vitest";
import { didRankDevPreviewEnabled } from "./didRankDevPreviewGate";

describe("didRankDevPreviewGate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("off in production even when DEMO_PREVIEW=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW", "1");
    expect(didRankDevPreviewEnabled()).toBe(false);
  });

  it("on only when env explicitly set in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW", "1");
    expect(didRankDevPreviewEnabled()).toBe(true);
  });
});
