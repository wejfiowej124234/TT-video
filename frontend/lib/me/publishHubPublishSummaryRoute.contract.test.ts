import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLISH_HUB_SUMMARY_API_IMPL_STATUS,
} from "@/lib/me/publishHubServerSummaryModel";

const ROOT = process.cwd();
const ROUTE = readFileSync(join(ROOT, "app/api/v1/me/publish-summary/route.ts"), "utf8");

describe("publish-summary BFF route (W1-A4 · upstream-first)", () => {
  it("prefers traveltrust-api publish-summary before local aggregate", () => {
    expect(ROUTE).toContain("/api/v1/me/publish-summary");
    expect(ROUTE).toContain("parsePublishHubServerSummaryPayload");
    expect(ROUTE.indexOf("fetchUpstreamJson(req, \"/api/v1/me/publish-summary\")")).toBeLessThan(
      ROUTE.indexOf("Promise.all"),
    );
  });

  it("fallback aggregate uses BFF meta constants", () => {
    expect(ROUTE).toContain("PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS");
    expect(ROUTE).toContain("PUBLISH_HUB_SUMMARY_BFF_SOURCE");
  });

  it("api implementation_status matches Rust handler", () => {
    const rust = readFileSync(
      join(ROOT, "../crates/api/src/chain_off/publish_summary.rs"),
      "utf8",
    );
    expect(rust).toContain(PUBLISH_HUB_SUMMARY_API_IMPL_STATUS);
  });
});
