import { describe, expect, it } from "vitest";
import {
  classifyEscrowChainTxError,
  escrowChainTxErrorUserMessage,
} from "./mapEscrowChainTxError";

const t = (k: string) =>
  ({
    escrow_txErrorUserRejected: "USER_REJECTED",
    escrow_allowanceHint: "ALLOWANCE",
    escrow_txErrorGeneric: "GENERIC",
  })[k] ?? k;

describe("mapEscrowChainTxError", () => {
  it("classifies empty as none", () => {
    expect(classifyEscrowChainTxError("")).toBe("none");
    expect(classifyEscrowChainTxError(null)).toBe("none");
  });

  it("classifies user rejection", () => {
    expect(classifyEscrowChainTxError("User rejected the request.")).toBe("user_rejected");
    expect(classifyEscrowChainTxError("MetaMask Tx Signature: User denied")).toBe("user_rejected");
  });

  it("classifies allowance-related", () => {
    expect(classifyEscrowChainTxError("ERC20: insufficient allowance")).toBe("allowance");
    expect(classifyEscrowChainTxError("exceeds allowance")).toBe("allowance");
    expect(classifyEscrowChainTxError("ERC20InsufficientAllowance()")).toBe("allowance");
    expect(classifyEscrowChainTxError("transfer amount exceeds allowance")).toBe("allowance");
  });

  it("maps to user strings via t()", () => {
    expect(escrowChainTxErrorUserMessage("", t)).toBe("");
    expect(escrowChainTxErrorUserMessage("User rejected", t)).toBe("USER_REJECTED");
    expect(escrowChainTxErrorUserMessage("insufficient allowance", t)).toBe("ALLOWANCE");
    expect(escrowChainTxErrorUserMessage("execution reverted: boom", t)).toBe("GENERIC");
  });
});
