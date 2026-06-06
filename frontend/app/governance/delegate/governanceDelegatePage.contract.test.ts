import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readGovernanceDelegateModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "GovernanceDelegatePageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useGovernanceDelegatePage.ts"), "utf8"),
    readFileSync(join(__dir, "governanceDelegatePageModel.ts"), "utf8"),
  ].join("\n");
}

describe("governance delegate page (B-073 delegate + receipt)", () => {
  const src = readGovernanceDelegateModuleSources();

  it("keeps governance delegate HTTP helpers and session gate wired", () => {
    expect(src).toContain("getGovernanceDelegate");
    expect(src).toContain("postGovernanceDelegate");
    expect(src).toContain("deleteGovernanceDelegate");
    expect(src).toContain("hasClientSession");
    expect(src).toContain("AUTH_SESSION_TOKEN_KEY");
  });

  it("keeps search-params suspense shell and DOM / login return anchors", () => {
    expect(src).toContain("GovernanceSearchParamsRouteSuspense");
    expect(src).toContain('data-tt-governance-delegate-page="1"');
    expect(src).toContain('buildLoginReturnPathWithQuery');
    expect(src).toContain('"/governance/delegate"');
  });

  it("documents B-073 receipt fields in module sources", () => {
    expect(src).toContain("B-073");
    expect(src).toContain("request_id");
    expect(src).toContain("tx_hash");
  });
});
