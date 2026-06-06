import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readCommunityFeedbackPageModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "CommunityFeedbackPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useCommunityFeedbackPage.ts"), "utf8"),
    readFileSync(join(__dir, "useCommunityFeedbackPageToast.ts"), "utf8"),
    readFileSync(join(__dir, "useCommunityFeedbackPageMedia.ts"), "utf8"),
    readFileSync(join(__dir, "communityFeedbackSubmitValidation.ts"), "utf8"),
    readFileSync(join(__dir, "communityFeedbackLocalDraftItem.ts"), "utf8"),
    readFileSync(join(__dir, "useCommunityFeedbackPageModalEffects.ts"), "utf8"),
    readFileSync(join(__dir, "communityFeedbackPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("community feedback page (contract)", () => {
  const src = readCommunityFeedbackPageModuleSources();

  it("does not reference internal API paths", () => {
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
  });

  it("keeps public feedback POST client and page marker", () => {
    expect(src).toContain("postFeedback");
    expect(src).toContain('data-tt-community-feedback-page="1"');
  });
});
