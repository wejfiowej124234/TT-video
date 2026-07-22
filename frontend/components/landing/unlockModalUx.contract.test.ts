import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const modal = join(__dirname, "UnlockModal.tsx");

describe("UnlockModal preview honesty (①)", () => {
  it("uses dark glass shell and no fake pay amount in copy", () => {
    const src = readFileSync(modal, "utf8");
    expect(src).toContain("bg-ink-950/95");
    expect(src).not.toContain("UNLOCK_PRICE_USD");
    expect(src).toContain('t("unlock_btn_pay")');
    expect(src).toContain('t("unlock_payment_note")');
    expect(src).toContain('role="alert"');
    expect(src).toContain("unlockError");
    expect(src).toContain('data-tt-landing-unlock-honesty="phase1-preview-no-usdc"');
    expect(src).toContain("unlock_honesty_badge");
    expect(src).toContain('data-tt-landing-unlock-honesty-badge="1"');
  });
});
