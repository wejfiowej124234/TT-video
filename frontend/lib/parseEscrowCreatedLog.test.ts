import { describe, expect, it } from "vitest";
import type { Abi, TransactionReceipt } from "viem";
import { encodeEventTopics, getAddress, pad } from "viem";
import escrowFactoryAbi from "@/dapp/abis/EscrowFactory.json";
import { escrowAddressFromFactoryReceipt } from "./parseEscrowCreatedLog";

const FACTORY = "0x1111111111111111111111111111111111111111" as `0x${string}`;
const OTHER = "0x2222222222222222222222222222222222222222" as `0x${string}`;

function partialReceipt(logs: TransactionReceipt["logs"]): TransactionReceipt {
  return { logs } as unknown as TransactionReceipt;
}

describe("escrowAddressFromFactoryReceipt", () => {
  it("returns null when receipt has no logs", () => {
    expect(escrowAddressFromFactoryReceipt(partialReceipt([]), FACTORY)).toBeNull();
  });

  it("returns null when no log from the factory address", () => {
    const logs = [{ address: OTHER, data: "0x" as const, topics: [] as const }] as unknown;
    expect(escrowAddressFromFactoryReceipt(partialReceipt(logs as TransactionReceipt["logs"]), FACTORY)).toBeNull();
  });

  it("matches factory case-insensitively for log address", () => {
    const logs = [
      { address: FACTORY.toUpperCase() as `0x${string}`, data: "0x" as const, topics: [] as const },
    ] as unknown;
    expect(escrowAddressFromFactoryReceipt(partialReceipt(logs as TransactionReceipt["logs"]), FACTORY)).toBeNull();
  });

  it("decodes EscrowCreated and returns indexed escrow address", () => {
    const escrow = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as `0x${string}`;
    const topics = encodeEventTopics({
      abi: escrowFactoryAbi as Abi,
      eventName: "EscrowCreated",
      args: {
        orderId: pad("0x01", { size: 32 }),
        escrow,
      },
    });
    const logs = [
      {
        address: FACTORY,
        data: "0x" as const,
        topics,
      },
    ] as unknown;
    const got = escrowAddressFromFactoryReceipt(partialReceipt(logs as TransactionReceipt["logs"]), FACTORY);
    expect(got).not.toBeNull();
    expect(got).toBe(getAddress(escrow));
  });
});
