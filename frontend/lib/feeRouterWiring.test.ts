import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/feeRouterEnv", () => ({
  getFeeRouterAddress: vi.fn(),
}));

import { getFeeRouterAddress } from "@/lib/feeRouterEnv";
import {
  computeFeeRouterWiringUi,
  rawFeeRouterFromMeta,
  shortHexAddr,
  normalizeEvmAddr,
} from "./feeRouterWiring";

describe("rawFeeRouterFromMeta", () => {
  it("reads fee_router_address", () => {
    expect(
      rawFeeRouterFromMeta({
        chain: { contracts: { fee_router_address: " 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa " } },
      })
    ).toMatch(/0xaaaa/i);
  });

  it("falls back to escrow_platform_fee_recipient", () => {
    expect(
      rawFeeRouterFromMeta({
        chain: { contracts: { escrow_platform_fee_recipient: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" } },
      })
    ).toMatch(/0xbbbb/i);
  });
});

describe("computeFeeRouterWiringUi", () => {
  beforeEach(() => {
    vi.mocked(getFeeRouterAddress).mockReturnValue(null);
  });

  it("detects mismatch", () => {
    vi.mocked(getFeeRouterAddress).mockReturnValue("0x1111111111111111111111111111111111111111");
    const ui = computeFeeRouterWiringUi({
      chain: { contracts: { fee_router_address: "0x2222222222222222222222222222222222222222" } },
    });
    expect(ui.mismatch).toBe(true);
    expect(ui.neither).toBe(false);
  });

  it("detects aligned", () => {
    vi.mocked(getFeeRouterAddress).mockReturnValue("0x1111111111111111111111111111111111111111");
    const ui = computeFeeRouterWiringUi({
      chain: { contracts: { fee_router_address: "0x1111111111111111111111111111111111111111" } },
    });
    expect(ui.mismatch).toBe(false);
    expect(ui.metaAddr).toBe("0x1111111111111111111111111111111111111111");
  });

  it("neither when no sources", () => {
    const ui = computeFeeRouterWiringUi({ chain: { contracts: {} } });
    expect(ui.neither).toBe(true);
  });
});

describe("helpers", () => {
  it("shortHexAddr truncates", () => {
    expect(shortHexAddr("0xabcdef0123456789abcdef0123456789abcdef01")).toContain("…");
  });

  it("normalizeEvmAddr checksums", () => {
    const a = normalizeEvmAddr("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(a?.startsWith("0x")).toBe(true);
  });
});
