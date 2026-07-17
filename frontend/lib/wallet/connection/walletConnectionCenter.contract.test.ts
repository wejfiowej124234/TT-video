import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTravelTrustWagmiConnectors } from "@/lib/wallet/connection/createTravelTrustWagmiConnectors";

const ROOT = process.cwd();

describe("Wallet Connection Center L5 contract (①)", () => {
  it("Providers uses shared connector factory + EIP-6963 discovery", () => {
    const providers = readFileSync(join(ROOT, "components/Providers.tsx"), "utf8");
    expect(providers).toContain("createTravelTrustWagmiConnectors");
    expect(providers).toContain("multiInjectedProviderDiscovery: true");
    expect(providers).not.toContain("@rainbow-me/rainbowkit");
  });

  it("connector factory includes injected/metaMask/coinbase/safe and optional WC", () => {
    const withoutWc = createTravelTrustWagmiConnectors({ walletConnectProjectId: "" });
    expect(withoutWc.length).toBeGreaterThanOrEqual(4);
    const withWc = createTravelTrustWagmiConnectors({ walletConnectProjectId: "demo-project-id" });
    expect(withWc.length).toBe(withoutWc.length + 1);
  });

  it("sheet + controller + capability SSOT exist", () => {
    const sheet = readFileSync(join(ROOT, "components/trust/TravelTrustWalletSheet.tsx"), "utf8");
    const mini = readFileSync(join(ROOT, "components/trust/WalletStatusMini.tsx"), "utf8");
    const types = readFileSync(join(ROOT, "lib/wallet/connection/types.ts"), "utf8");
    const evidence = readFileSync(
      join(ROOT, "evidence/GO_local_wallet_connection_l5/README.md"),
      "utf8"
    );
    expect(sheet).toContain("data-tt-wallet-sheet-l5");
    expect(sheet).toContain("wallet_wc_mobile_deeplink");
    expect(mini).toContain("useWalletConnectionController");
    expect(types).toContain("TT_WALLET_CONNECTION_CAPABILITY");
    expect(types).toContain("custodiesKeys: false");
    expect(evidence).toContain("Manual UAT");
    expect(evidence).toContain("smoke-wallet-connection-l5-local.sh");
  });

  it("forbids custody / import / embedded surfaces in connection UI", () => {
    const sheet = readFileSync(join(ROOT, "components/trust/TravelTrustWalletSheet.tsx"), "utf8");
    expect(sheet.toLowerCase()).not.toContain("mnemonic");
    expect(sheet.toLowerCase()).not.toContain("private key");
    expect(sheet.toLowerCase()).not.toContain("import wallet");
    expect(sheet).not.toContain("embedded");
  });
});
