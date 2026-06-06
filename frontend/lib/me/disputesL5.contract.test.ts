import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("disputes L5 settings extension (①)", () => {
  it("list page uses settings L5 shell without ProductCrossNav", () => {
    const list = readFileSync(join(ROOT, "app/disputes/DisputesListPageMain.tsx"), "utf8");
    const shell = readFileSync(join(ROOT, "components/disputes/DisputesL5PageShell.tsx"), "utf8");
    expect(list).toContain("DisputesL5PageShell");
    expect(list).not.toContain("ProductCrossNav");
    expect(shell).toContain("DISPUTES_L5_ROUTE_MARKER_LIST");
    expect(list).toContain("data-tt-disputes-empty");
    expect(list).toContain("disputes_empty");
    expect(list).toContain("formatUserFacingDateTime");
  });

  it("detail loaded view uses L5 shell", () => {
    const detail = readFileSync(join(ROOT, "app/disputes/[id]/DisputeDetailLoadedView.tsx"), "utf8");
    expect(detail).toContain("DisputesL5PageShell");
    expect(detail).not.toContain("ProductCrossNav");
  });

  it("route client delegates to modular DisputeDetailPageInner", () => {
    const client = readFileSync(join(ROOT, "app/disputes/[id]/DisputeDetailPageClient.tsx"), "utf8");
    expect(client).toContain('from "./DisputeDetailPageInner"');
    expect(client).not.toContain("ProductCrossNav");
    expect(client.length).toBeLessThan(800);
  });

  it("detail sections avoid console ink tokens", () => {
    const timeline = readFileSync(join(ROOT, "app/disputes/[id]/DisputeDetailTimelineSection.tsx"), "utf8");
    expect(timeline).toContain("TT_DISPUTES_L5");
    expect(timeline).not.toContain("text-ink-800");
    expect(timeline).toContain("formatUserFacingDateTime");
  });
});
