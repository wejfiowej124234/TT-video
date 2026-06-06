import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const ESCROW_DETAIL = join(ROOT, "components", "escrow", "EscrowDetail");
const FREEZE_DOC = join(ROOT, "evidence", "GO_local_web3_itinerary_l5", "ESCROW-DRAFT-EXPERIENCE-FREEZE.md");
const INDEX = join(ESCROW_DETAIL, "index.tsx");

const ESCROW_DRAFT_FROZEN_FILES = [
  "EscrowDraftAdvancedProtocolFold.tsx",
  "EscrowDraftDayNarrativePanel.tsx",
  "EscrowDraftExperienceFooter.tsx",
  "EscrowDraftGuideAssignedCard.tsx",
  "EscrowDraftGuideEmptyCard.tsx",
  "EscrowDraftItineraryTabBar.tsx",
  "EscrowDraftMobileActionBar.tsx",
  "EscrowDraftNextStepStrip.tsx",
  "EscrowDraftPayStepCard.tsx",
  "EscrowDraftPublishedBanner.tsx",
  "EscrowDraftTravelNotice.tsx",
  "EscrowDraftTrustPayStrip.tsx",
] as const;

describe("/escrow/[id] draft Experience UI freeze (① · ESCROW-DRAFT-EXPERIENCE-FREEZE)", () => {
  it("freeze SSOT doc exists and declares hard gate", () => {
    const doc = readFileSync(FREEZE_DOC, "utf8");
    expect(doc).toContain("UI 冻结");
    expect(doc).toContain("2026-05-28");
    expect(doc).toContain("run-web3-itinerary-l5-green.sh");
  });

  it("all EscrowDraft* component files exist on disk", () => {
    const onDisk = readdirSync(ESCROW_DETAIL).filter((f) => f.startsWith("EscrowDraft") && f.endsWith(".tsx"));
    for (const f of ESCROW_DRAFT_FROZEN_FILES) {
      expect(onDisk, `missing ${f}`).toContain(f);
    }
  });

  it("index.tsx wires Experience freeze anchors and dev-tools gate", () => {
    const src = readFileSync(INDEX, "utf8");
    expect(src).toContain('data-tt-escrow-draft-experience-ui-frozen');
    expect(src).toContain("experienceDraft");
    expect(src).toContain("isEscrowExperienceDevToolsEnabled()");
    expect(src).toContain("EscrowDraftAdvancedProtocolFold");
    expect(src).toContain("EscrowDraftPublishedBanner");
    expect(src).toContain("EscrowDraftExperienceFooter");
    expect(src).toContain("hideWhenPublishedBanner");
    expect(src).toContain("richCollapsedPreview");
    expect(src).toContain("showExperienceFooterCancel");
  });

  it("advanced fold is behind dev tools, not default for travelers", () => {
    const src = readFileSync(INDEX, "utf8");
    expect(src).toMatch(
      /experienceDraft\s*&&\s*!data\.isDraft\s*&&\s*isEscrowExperienceDevToolsEnabled\(\)/,
    );
    expect(src).toContain("escrow_orderActions_touristDevFoldHint");
  });

  it("experience draft path does not embed ChatBlock or EscrowRiskNotice by default", () => {
    const src = readFileSync(INDEX, "utf8");
    const experienceBlocks = src.slice(src.indexOf("const experienceDraft"), src.indexOf("return ("));
    expect(experienceBlocks).not.toContain("ChatBlock");
    expect(src).toMatch(/\{!experienceDraft \? \([\s\S]*EscrowRiskNotice/);
  });

  it("EscrowDraftAdvancedProtocolFold shows developer badge i18n", () => {
    const fold = readFileSync(join(ESCROW_DETAIL, "EscrowDraftAdvancedProtocolFold.tsx"), "utf8");
    expect(fold).toContain("escrow_draftProtocolFold_devBadge");
  });

  it("footer exposes cancel in more without dev tools", () => {
    const footer = readFileSync(join(ESCROW_DETAIL, "EscrowDraftExperienceFooter.tsx"), "utf8");
    expect(footer).toContain("showCancelOrder");
    expect(footer).toContain("escrow_cancelOrder");
    expect(footer).toContain("TT_ESCROW_EXPERIENCE_FOOTER_PANEL");
    expect(footer).toContain("escrow_experienceFooter_toolsLabel");
    expect(footer).toContain("escrow_experienceFooter_helpLabel");
    expect(footer).toContain('data-tt-escrow-experience-footer="1"');
  });
});
