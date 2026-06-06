import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const INDEX = join(ROOT, "components", "escrow", "EscrowDetail", "index.tsx");
const BREADCRUMB = join(ROOT, "components", "escrow", "EscrowDetail", "EscrowDetailOrdersBreadcrumb.tsx");
const PROTOCOL_UI = join(ROOT, "lib", "escrowProtocolUi.ts");

describe("/escrow/[id] protocol shell L5 (① · on-chain / non-draft)", () => {
  it("exports warm protocol tokens aligned with orders list", () => {
    const src = readFileSync(PROTOCOL_UI, "utf8");
    expect(src).toContain("TT_ESCROW_PROTOCOL_ZONE");
    expect(src).toContain("border-ref-sun");
    expect(src).not.toContain("border-cyan");
    expect(src).toContain("escrowProtocolFooterActionClass");
  });

  it("EscrowDetail uses protocol tokens when not experience draft", () => {
    const src = readFileSync(INDEX, "utf8");
    expect(src).toContain("TT_ESCROW_PROTOCOL_ZONE");
    expect(src).toContain("data-tt-escrow-protocol-l5");
    expect(src).toContain("EscrowDetailOrdersBreadcrumb");
    expect(src).toContain("!experienceDraft ? <EscrowDetailOrdersBreadcrumb />");
    expect(src).toContain("escrowProtocolFooterActionClass");
    expect(src).not.toContain("border-cyan-500");
    expect(src).not.toContain("text-cyan-300");
  });

  it("orders breadcrumb links back to /orders", () => {
    const src = readFileSync(BREADCRUMB, "utf8");
    expect(src).toContain('href="/orders"');
    expect(src).toContain('data-tt-escrow-orders-breadcrumb="1"');
    expect(src).toContain("escrow_breadcrumb_current");
  });

  it("orders list card exposes escrow deep-link marker for E2E", () => {
    const card = readFileSync(join(ROOT, "app", "orders", "OrdersListCardItem.tsx"), "utf8");
    expect(card).toContain('data-tt-orders-list-card-escrow-link="1"');
    expect(card).toContain("stashEscrowOrderPrefetchFromListItem");
  });

  it("rate page uses warm L5 tokens via escrowRateL5", () => {
    const rateL5 = readFileSync(join(ROOT, "lib", "escrowRateL5.ts"), "utf8");
    expect(rateL5).toContain("TT_ESCROW_RATE_PAGE_SHELL");
    expect(rateL5).not.toContain("border-cyan");
    const main = readFileSync(join(ROOT, "app", "escrow", "[id]", "rate", "EscrowRatePageMain.tsx"), "utf8");
    expect(main).toContain("data-tt-escrow-rate-l5");
    expect(main).not.toContain("text-cyan");
    const page = readFileSync(join(ROOT, "app", "escrow", "[id]", "rate", "page.tsx"), "utf8");
    expect(page).toContain("EscrowRatePageInner");
    expect(page.length).toBeLessThan(500);
    const legacyClient = join(ROOT, "app", "escrow", "[id]", "rate", "EscrowRatePageClient.tsx");
    expect(() => readFileSync(legacyClient, "utf8")).toThrow();
  });

  it("protocol sub-blocks avoid cyan defaults when variantDid", () => {
    for (const file of [
      "OrderActionsBlock.tsx",
      "SetEscrowAddressBlock.tsx",
      "CreateOnChainEscrowBlock.tsx",
      "ReviewBlock.tsx",
      "reviewBlockChrome.ts",
      "QuoteSummaryCard.tsx",
      "ChatBlock.tsx",
      "OrderMessageLink.tsx",
      "ConfirmFinalPlanBlock.tsx",
      "EscrowDetailProtocolTailRatingReviewChain.tsx",
    ]) {
      const src = readFileSync(join(ROOT, "components", "escrow", "EscrowDetail", file), "utf8");
      expect(src, file).toContain("escrowProtocol");
      expect(src, file).not.toContain("border-cyan-500");
      expect(src, file).not.toContain("text-cyan-300");
      expect(src, file).not.toContain("marketCyan");
    }
  });

  it("ChatBlock exposes protocol chat markers for E2E", () => {
    const chat = readFileSync(join(ROOT, "components", "escrow", "EscrowDetail", "ChatBlock.tsx"), "utf8");
    expect(chat).toContain('data-tt-escrow-chat-block="1"');
    expect(chat).toContain("escrowProtocolChatInputClass");
    const msg = readFileSync(join(ROOT, "components", "escrow", "EscrowDetail", "OrderMessageLink.tsx"), "utf8");
    expect(msg).toContain('data-tt-escrow-order-message-link="1"');
    expect(msg).toContain("TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT");
  });
});
