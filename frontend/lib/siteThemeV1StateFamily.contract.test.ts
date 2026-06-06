/**
 * D7 · 225-E · 五主路由 loading/error/空态族：禁主路径 bg-cta-gradient，retry/CTA 走暖金 token
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("site theme V1 state family (225-E · D7)", () => {
  it("home loading/error shells avoid cold CTA gradient", () => {
    expect(read("app/(home)/loading.tsx")).not.toContain("bg-cta-gradient");
    expect(read("app/(home)/error.tsx")).not.toContain("bg-cta-gradient");
    expect(read("app/(home)/error.tsx")).not.toContain("ref-cyan");
  });

  it("market EmptyState uses warm primary and light cross-nav token", () => {
    const src = read("components/market/EmptyState.tsx");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
    expect(src).toContain("emptyStateLightCrossNavLink");
    expect(src).not.toContain("bg-cta-gradient");
    expect(src).not.toContain("text-travel-600");
  });

  it("community feed retry uses warm retryPill not bg-cta-gradient", () => {
    const main = read("components/community/CommunityFeedMain.tsx");
    expect(main).toContain("retryPill");
    expect(main).not.toContain("bg-cta-gradient");
  });

  it("did-rank theme contract path avoids bg-cta-gradient on page shell", () => {
    const page = read("app/did-rank/page.tsx");
    expect(page).not.toContain("bg-cta-gradient");
  });

  it("UnlockModal pay uses home unlock warm FAB (G22 · /)", () => {
    const src = read("components/landing/UnlockModal.tsx");
    expect(src).toContain("TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN");
    expect(src).toContain('data-testid="unlock-modal"');
    expect(src).not.toContain("bg-cta-gradient");
  });
});
