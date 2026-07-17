import { describe, expect, it } from "vitest";
import { deriveWalletPhase } from "@/lib/wallet/connection/deriveWalletPhase";
import { classifyConnectError } from "@/lib/wallet/connection/classifyConnectError";
import { assertWalletCanWrite } from "@/lib/wallet/connection/writeGuard";
import { isMobileWalletClient, walletConnectUxMode } from "@/lib/wallet/connection/device";
import { TT_WALLET_CONNECTION_CAPABILITY } from "@/lib/wallet/connection/types";

const base = {
  viewOnlyAddress: null as string | null,
  isConnected: false,
  isPending: false,
  accountStatus: "disconnected",
  errorKind: null as null,
  wrongNetwork: false,
  sheetOpen: false,
  accountChangedPulse: false,
};

describe("wallet connection shared kernel", () => {
  it("declares connect-only capability (no custody)", () => {
    expect(TT_WALLET_CONNECTION_CAPABILITY.createsWallet).toBe(false);
    expect(TT_WALLET_CONNECTION_CAPABILITY.custodiesKeys).toBe(false);
    expect(TT_WALLET_CONNECTION_CAPABILITY.storesMnemonics).toBe(false);
    expect(TT_WALLET_CONNECTION_CAPABILITY.connects).toBe(true);
  });

  it("deriveWalletPhase covers connect matrix", () => {
    expect(deriveWalletPhase(base)).toBe("disconnected");
    expect(deriveWalletPhase({ ...base, sheetOpen: true })).toBe("sheetOpen");
    expect(deriveWalletPhase({ ...base, isPending: true })).toBe("connecting");
    expect(deriveWalletPhase({ ...base, errorKind: "rejected" })).toBe("rejected");
    expect(deriveWalletPhase({ ...base, errorKind: "locked" })).toBe("locked");
    expect(deriveWalletPhase({ ...base, errorKind: "expired" })).toBe("expired");
    expect(
      deriveWalletPhase({ ...base, viewOnlyAddress: "0x1", isConnected: false })
    ).toBe("viewOnly");
    expect(
      deriveWalletPhase({ ...base, isConnected: true, wrongNetwork: true })
    ).toBe("wrongNetwork");
    expect(
      deriveWalletPhase({
        ...base,
        isConnected: true,
        accountChangedPulse: true,
      })
    ).toBe("accountChanged");
    expect(deriveWalletPhase({ ...base, isConnected: true })).toBe("connected");
  });

  it("classifyConnectError maps wallet UX failures", () => {
    expect(classifyConnectError(new Error("User rejected the request"))).toBe("rejected");
    expect(classifyConnectError(new Error("wallet locked"))).toBe("locked");
    expect(classifyConnectError(new Error("Session expired"))).toBe("expired");
    expect(classifyConnectError(new Error("Provider not found"))).toBe("unavailable");
  });

  it("writeGuard blocks view-only and wrong network", () => {
    expect(
      assertWalletCanWrite({
        isConnected: false,
        viewOnlyAddress: "0xabc",
        wrongNetwork: false,
      })
    ).toEqual({ canWrite: false, reason: "view_only" });
    expect(
      assertWalletCanWrite({
        isConnected: true,
        viewOnlyAddress: null,
        wrongNetwork: true,
      })
    ).toEqual({ canWrite: false, reason: "wrong_network" });
    expect(
      assertWalletCanWrite({
        isConnected: true,
        viewOnlyAddress: null,
        wrongNetwork: false,
      })
    ).toEqual({ canWrite: true, reason: null });
  });

  it("mobile deep-link UX mode", () => {
    expect(isMobileWalletClient("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      true
    );
    expect(walletConnectUxMode("Mozilla/5.0 (iPhone)")).toBe("deeplink");
    expect(walletConnectUxMode("Mozilla/5.0 (Windows NT 10.0)")).toBe("qr");
  });
});
