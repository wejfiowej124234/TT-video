import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  L5_FIVE_ROLE_AUDIT_ROLES,
  L5_MULTI_DIM_OPEN_P0,
  L5_MULTI_DIM_OPEN_P1,
  L5_MULTI_DIM_PROGRAM_ID,
  L5_MULTI_DIMENSIONAL_FINDINGS,
} from "./l5MultiDimensionalFindingsModel";
import { TRAVELER_L5_BANNED_CONSUMER_COPY } from "../travelerL5ExcellenceSprintModel";

const feRoot = join(__dirname, "../..");

function read(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function extractLocaleValue(src: string, key: string): string {
  const re = new RegExp(`${key}:\\s*"([^"]*)"`, "m");
  const single = src.match(re);
  if (single?.[1]) return single[1];
  const multi = src.match(new RegExp(`${key}:\\s*\\n\\s*"([^"]*)"`, "m"));
  return multi?.[1] ?? "";
}

const PAY_CONSUMER_KEYS = [
  "pay_pageTitle",
  "pay_pageSubtitle",
  "pay_flowContext_escrowPhaseHub",
  "pay_escrowPhase_calloutTitle",
  "pay_escrowPhase_bodyNoEscrow",
  "pay_flowContext_fromOrder",
  "pay_hubNotDepositPhaseNotice",
] as const;

const ESCROW_DRAFT_TRUST_KEYS = [
  "escrow_draftPayTrust_lock",
  "escrow_draftPayTrust_usdc",
  "escrow_draftPayTrust_step3",
] as const;

const NAV_CONSUMER_KEYS = [
  "header_web3Travel",
  "community_back",
  "auth_login_web3Travel",
  "auth_register_web3Travel",
  "me_back",
  "didRank_back",
] as const;

const FOOTER_CONSUMER_KEYS = ["footer_about_desc", "footer_tagline", "meta_description"] as const;

describe("L5 Multi-Dimensional Audit Sprint (five roles · ①)", () => {
  it("registers program id, five roles, and findings matrix", () => {
    expect(L5_MULTI_DIM_PROGRAM_ID).toContain("l5-five-role-audit-sprint");
    expect(L5_FIVE_ROLE_AUDIT_ROLES).toHaveLength(5);
    expect(L5_MULTI_DIMENSIONAL_FINDINGS.length).toBeGreaterThanOrEqual(24);
    expect(L5_MULTI_DIM_OPEN_P0).toHaveLength(0);
    expect(L5_MULTI_DIM_OPEN_P1).toHaveLength(0);
  });

  it("findings matrix markdown exists with P0/P1/P2 sections", () => {
    const md = read("evidence/L5-MULTI-DIMENSIONAL-EXCELLENCE-FINDINGS-MATRIX.md");
    expect(md).toContain("L5 Findings Matrix");
    expect(md).toContain("P0");
    expect(md).toContain("P1");
    expect(md).toContain("P2");
    expect(md).toContain("看得懂");
    expect(md).toContain("Traveler");
  });

  it("pay hub consumer keys avoid banned jargon", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of PAY_CONSUMER_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(TRAVELER_L5_BANNED_CONSUMER_COPY);
      }
    }
  });

  it("escrow draft trust strip and nav/footer consumer keys avoid banned jargon", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of [...ESCROW_DRAFT_TRUST_KEYS, ...NAV_CONSUMER_KEYS, ...FOOTER_CONSUMER_KEYS]) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(TRAVELER_L5_BANNED_CONSUMER_COPY);
      }
    }
  });

  it("itinerary day cost placeholder uses consumer copy", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const value = extractLocaleValue(read(localeFile), "itin_dayCostPlaceholder");
      expect(value).not.toMatch(/待按日拆分|per-day breakdown is available/i);
    }
  });

  it("draft orders hide contract address row", () => {
    const card = read("app/orders/OrdersListCardItem.tsx");
    expect(card).toContain("isDraftOrderListState");
    expect(card).toContain("escrow_address");
  });

  it("preview card resolves display amount from order.amount SSOT", () => {
    const preview = read("components/landing/ItineraryResultsSection.tsx");
    expect(preview).toContain("resolveEscrowDisplayAmount");
    expect(preview).not.toContain("stablecoinPair");
  });
});
