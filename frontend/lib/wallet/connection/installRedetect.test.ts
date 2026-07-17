import { describe, expect, it } from "vitest";
import {
  consumeWalletInstallPending,
  markWalletInstallPending,
  shouldReloadAfterInstallReturn,
  TT_WALLET_AWAIT_INSTALL_KEY,
} from "@/lib/wallet/connection/installRedetect";

describe("installRedetect", () => {
  it("marks and consumes pending install brand", () => {
    sessionStorage.clear();
    markWalletInstallPending("metamask");
    expect(sessionStorage.getItem(TT_WALLET_AWAIT_INSTALL_KEY)).toBe("metamask");
    expect(consumeWalletInstallPending()).toBe("metamask");
    expect(consumeWalletInstallPending()).toBeNull();
  });

  it("reloads only when visible + pending", () => {
    expect(
      shouldReloadAfterInstallReturn({
        visibilityState: "visible",
        hadPendingInstall: true,
      })
    ).toBe(true);
    expect(
      shouldReloadAfterInstallReturn({
        visibilityState: "hidden",
        hadPendingInstall: true,
      })
    ).toBe(false);
    expect(
      shouldReloadAfterInstallReturn({
        visibilityState: "visible",
        hadPendingInstall: false,
      })
    ).toBe(false);
  });
});
