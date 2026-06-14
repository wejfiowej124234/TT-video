import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER,
} from "./providerWorkbenchL5ClosureSprintModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("providerWorkbench L5 closure (①)", () => {
  it("exports freeze markers", () => {
    expect(PROVIDER_WORKBENCH_PAGE_L5_CLOSURE_PROBE).toBe("provider-workbench-full-v1");
    expect(PROVIDER_WORKBENCH_PAGE_L5_FROZEN_MARKER).toBe("provider-workbench-l5-20260612");
  });

  it("listsings summary API client wired", () => {
    expect(read("lib/apiClient/meMerchantListingsSummary.ts")).toContain("getMeMerchantListingsSummary");
    expect(read("lib/api/routes.ts")).toContain("meMerchantListingsSummary");
  });

  it("studio deep link opens showcase modal via query param", () => {
    const hook = read("components/market/useMarketStandaloneBusinessPage.ts");
    expect(hook).toContain('searchParams.get("studio")');
  });
});
