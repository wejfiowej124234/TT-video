import { describe, it, expect } from "vitest";
import {
  buildConfirmCompletionSignPayload,
  buildExecuteResolutionSignPayload,
  serializeTypedDataForIntentApi,
} from "./orderIntentTypedData";

describe("orderIntentTypedData", () => {
  it("serializeTypedDataForIntentApi uses decimal strings for uint256 fields", () => {
    const { domain, types, primaryType, message } = buildConfirmCompletionSignPayload({
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      verifyingContract: "0x1234567890123456789012345678901234567890",
      chainId: 137,
      nonce: BigInt(3),
      deadlineUnixSec: BigInt(99),
    });
    const json = serializeTypedDataForIntentApi(domain, types, primaryType, { ...message });
    expect(json.domain).toMatchObject({ chainId: 137, name: "TravelTrust" });
    expect((json.message as Record<string, string>).nonce).toBe("3");
    expect((json.message as Record<string, string>).deadline).toBe("99");
  });

  it("buildExecuteResolutionSignPayload includes dispute and order ids in message", () => {
    const { domain, types, primaryType, message } = buildExecuteResolutionSignPayload({
      disputeId: "d1",
      orderId: "o1",
      verifyingContract: "0x1234567890123456789012345678901234567890",
      chainId: 137,
      nonce: BigInt(1),
      deadlineUnixSec: BigInt(2),
    });
    expect(primaryType).toBe("ExecuteResolutionIntent");
    const json = serializeTypedDataForIntentApi(domain, types, primaryType, { ...message });
    expect((json.message as Record<string, string>).disputeId).toBe("d1");
    expect((json.message as Record<string, string>).orderId).toBe("o1");
  });
});
