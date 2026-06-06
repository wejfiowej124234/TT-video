import { describe, expect, it } from "vitest";

import { isDevChunkLoadMessage } from "@/lib/devChunkLoadRecovery";

describe("devChunkLoadRecovery", () => {
  it("detects ChunkLoadError and connection reset", () => {
    expect(isDevChunkLoadMessage("Uncaught ChunkLoadError: Loading chunk app/admin/page failed.")).toBe(
      true,
    );
    expect(isDevChunkLoadMessage("GET http://localhost:3012/_next/static/chunks/app/loading.js net::ERR_CONNECTION_RESET")).toBe(
      true,
    );
    expect(isDevChunkLoadMessage("random network error")).toBe(false);
  });
});
