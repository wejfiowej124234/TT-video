import { describe, expect, it } from "vitest";

import { applyLocalePlaceholders } from "@/lib/i18n";
import zh from "@/locales/zh";

import {
  isViemNoContractDataError,
  stakingReadsEnabled,
} from "./stakingContractDeployment";

describe("stakingContractDeployment", () => {
  it("detects viem no-data contract errors", () => {
    expect(
      isViemNoContractDataError('The contract function "token" returned no data ("0x").'),
    ).toBe(true);
    expect(isViemNoContractDataError("address is not a contract")).toBe(true);
    expect(isViemNoContractDataError("network timeout")).toBe(false);
  });

  it("gates reads until deployment is ready", () => {
    expect(stakingReadsEnabled(true, "ready")).toBe(true);
    expect(stakingReadsEnabled(true, "missing")).toBe(false);
    expect(stakingReadsEnabled(false, "ready")).toBe(false);
  });

  it("staking not-deployed copy interpolates chain ids", () => {
    const body = applyLocalePlaceholders(zh.staking_contract_notDeployedBody, {
      chainId: "31337",
      expectedChainId: "31337",
    });
    expect(body).toContain("31337");
    expect(body).not.toContain("{{chainId}}");
  });
});
