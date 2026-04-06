import { describe, expect, it } from "vitest";
import { mapWalletWriteError, walletErrorRaw } from "./mapWalletWriteError";

const t = (k: string) => k;

const opts = {
  revertPatterns: [{ re: /CustomRevert/i, messageKey: "custom_revert_msg" }] as const,
  rejectKey: "custom_reject",
  allowanceKey: "custom_allowance",
  genericKey: "custom_generic",
};

describe("walletErrorRaw", () => {
  it("returns empty string for null/undefined", () => {
    expect(walletErrorRaw(null)).toBe("");
    expect(walletErrorRaw(undefined)).toBe("");
  });

  it("concatenates message and shortMessage", () => {
    const err = new Error("main");
    (err as { shortMessage?: string }).shortMessage = "short";
    expect(walletErrorRaw(err)).toBe("main short");
  });
});

describe("mapWalletWriteError", () => {
  it("returns null when raw is empty", () => {
    expect(mapWalletWriteError(null, t, opts)).toBeNull();
    expect(mapWalletWriteError(new Error(""), t, opts)).toBeNull();
  });

  it("matches revertPatterns before reject/allowance", () => {
    expect(mapWalletWriteError(new Error("CustomRevert happened"), t, opts)).toBe("custom_revert_msg");
  });

  it("maps user rejection variants to rejectKey", () => {
    expect(mapWalletWriteError(new Error("User rejected the request"), t, opts)).toBe("custom_reject");
    expect(mapWalletWriteError(new Error("ACTION_REJECTED"), t, opts)).toBe("custom_reject");
    expect(mapWalletWriteError(new Error("code 4001"), t, opts)).toBe("custom_reject");
  });

  it("maps allowance-related messages to allowanceKey", () => {
    expect(mapWalletWriteError(new Error("ERC20: insufficient allowance"), t, opts)).toBe("custom_allowance");
    expect(mapWalletWriteError(new Error("Please approve token first"), t, opts)).toBe("custom_allowance");
    expect(mapWalletWriteError(new Error("ERC20InsufficientAllowance()"), t, opts)).toBe("custom_allowance");
    expect(mapWalletWriteError(new Error("transfer amount exceeds allowance"), t, opts)).toBe("custom_allowance");
  });

  it("falls back to genericKey", () => {
    expect(mapWalletWriteError(new Error("unknown chain explosion"), t, opts)).toBe("custom_generic");
  });

  it("uses default i18n keys when opts omit overrides", () => {
    const bare = { revertPatterns: [] as { re: RegExp; messageKey: string }[] };
    expect(mapWalletWriteError(new Error("User denied transaction"), t, bare)).toBe("wallet_txErrorUserRejected");
    expect(mapWalletWriteError(new Error("exceeds allowance"), t, bare)).toBe("staking_stake_errAllowance");
    expect(mapWalletWriteError(new Error("rpc timeout"), t, bare)).toBe("wallet_txErrorGeneric");
  });
});
