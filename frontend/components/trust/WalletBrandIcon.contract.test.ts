import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TT_WALLET_BRAND_ICON_KEYS } from "@/components/trust/WalletBrandIcon";
import { WALLET_INSTALL_URL, WALLET_RECOMMENDED_ORDER } from "@/lib/wallet/walletConnectorCatalog";

const ROOT = process.cwd();

describe("WalletBrandIcon + install URLs (L5)", () => {
  it("covers all recommended brands with SVG marks", () => {
    for (const brand of WALLET_RECOMMENDED_ORDER) {
      expect(TT_WALLET_BRAND_ICON_KEYS).toContain(brand);
    }
    expect(TT_WALLET_BRAND_ICON_KEYS).toContain("walletconnect");
  });

  it("sheet wires brand icons + brand-specific install hrefs", () => {
    const sheet = readFileSync(join(ROOT, "components/trust/TravelTrustWalletSheet.tsx"), "utf8");
    expect(sheet).toContain("WalletBrandIcon");
    expect(sheet).toContain("installUrlFor");
    expect(sheet).toContain("WALLET_INSTALL_URL");
    expect(sheet).toContain("wallet_current");
    /** Uninstalled recommended rows open install URL (not connect). */
    expect(sheet).toContain("href={installUrlFor(row.brandKey)}");
    expect(sheet).toContain("markWalletInstallPending");
    const ctrl = readFileSync(join(ROOT, "lib/wallet/useWalletConnectionController.ts"), "utf8");
    expect(ctrl).toContain("consumeWalletInstallPending");
    expect(ctrl).toContain("shouldReloadAfterInstallReturn");
  });

  it("each install URL is https and brand-distinct", () => {
    const urls = WALLET_RECOMMENDED_ORDER.map((k) => WALLET_INSTALL_URL[k]);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((u) => u.startsWith("https://"))).toBe(true);
  });
});
