import { describe, expect, it } from "vitest";
import {
  escrowEventTypeToOrderStateForBadge,
  resolveStatusForEscrowBadge,
} from "./orderChainDisplayStatus";
import type { OrderChainSyncState, OrderRow } from "./types";

function orderRow(partial: Partial<OrderRow> & Pick<OrderRow, "id">): OrderRow {
  return { ...partial };
}

/** 仅 `resolveStatusForEscrowBadge` 会读 `event_log_snapshot.event_type`；其余字段满足类型即可。 */
function chainSyncWithEventType(eventType: unknown): OrderChainSyncState {
  return {
    syncStatus: "confirmed",
    finalityN: 1,
    checkpointBlock: 1,
    checkpointLog: 0,
    eventLogSnapshot: {
      finality_n_used: 1,
      block_number: 1,
      log_index: 0,
      event_type: eventType as string,
    },
  };
}

describe("TT-ESCROW-007 · orderChainDisplayStatus", () => {
  describe("escrowEventTypeToOrderStateForBadge", () => {
    it("maps known contract event types to order-shaped badge states", () => {
      expect(escrowEventTypeToOrderStateForBadge("Paid")).toBe("escrowed");
      expect(escrowEventTypeToOrderStateForBadge("Released")).toBe("completed");
      expect(escrowEventTypeToOrderStateForBadge("Refunded")).toBe("refunded");
    });

    it("returns null for unknown keys (no bogus override state)", () => {
      expect(escrowEventTypeToOrderStateForBadge("NotARealEvent")).toBe(null);
    });

    it("returns null for null, undefined, blank, and non-primitive raw values without throwing", () => {
      expect(escrowEventTypeToOrderStateForBadge(null)).toBe(null);
      expect(escrowEventTypeToOrderStateForBadge(undefined)).toBe(null);
      expect(escrowEventTypeToOrderStateForBadge("   ")).toBe(null);
      expect(escrowEventTypeToOrderStateForBadge({})).toBe(null);
      expect(escrowEventTypeToOrderStateForBadge([])).toBe(null);
    });

    it("does not throw for number / boolean event_type raw values (no mapping → null)", () => {
      expect(escrowEventTypeToOrderStateForBadge(1)).toBe(null);
      expect(escrowEventTypeToOrderStateForBadge(true)).toBe(null);
    });
  });

  describe("resolveStatusForEscrowBadge", () => {
    it("does not override order.state when chain snapshot is absent", () => {
      const order = orderRow({ id: "o1", state: "accepted" });
      expect(resolveStatusForEscrowBadge(order, null)).toBe("accepted");
      expect(resolveStatusForEscrowBadge(order, undefined)).toBe("accepted");
    });

    it("does not override when chain_sync has no event_log_snapshot", () => {
      const order = orderRow({ id: "o1", state: "accepted" });
      const cs: OrderChainSyncState = {
        syncStatus: "confirmed",
        finalityN: 1,
        checkpointBlock: 1,
        checkpointLog: 0,
      };
      expect(resolveStatusForEscrowBadge(order, cs)).toBe("accepted");
    });

    it("when chain terminal state outranks lagging order.state, uses chain-derived state", () => {
      const order = orderRow({ id: "o1", state: "open" });
      const cs = chainSyncWithEventType("Released");
      expect(resolveStatusForEscrowBadge(order, cs)).toBe("completed");
    });

    it("unknown event_type does not override order.state", () => {
      const order = orderRow({ id: "o1", state: "escrowed" });
      const cs = chainSyncWithEventType("UnknownFutureEvent");
      expect(resolveStatusForEscrowBadge(order, cs)).toBe("escrowed");
    });

    it("null / undefined / blank event_type does not override", () => {
      const order = orderRow({ id: "o1", state: "funded" });
      const nullEt = chainSyncWithEventType(null);
      const undefEt = chainSyncWithEventType(undefined);
      const blank = chainSyncWithEventType("  \t  ");
      expect(resolveStatusForEscrowBadge(order, nullEt)).toBe("funded");
      expect(resolveStatusForEscrowBadge(order, undefEt)).toBe("funded");
      expect(resolveStatusForEscrowBadge(order, blank)).toBe("funded");
    });

    it("number / boolean event_type does not throw and does not override", () => {
      const order = orderRow({ id: "o1", state: "accepted" });
      expect(resolveStatusForEscrowBadge(order, chainSyncWithEventType(42))).toBe("accepted");
      expect(resolveStatusForEscrowBadge(order, chainSyncWithEventType(false))).toBe("accepted");
    });

    it("missing order.state/status returns empty string without throwing", () => {
      const order = orderRow({ id: "o1" });
      expect(resolveStatusForEscrowBadge(order, null)).toBe("");
    });

    it("does not downgrade a heavier order.state when chain maps to a lighter badge state", () => {
      const order = orderRow({ id: "o1", state: "completed" });
      const cs = chainSyncWithEventType("Paid");
      expect(resolveStatusForEscrowBadge(order, cs)).toBe("completed");
    });

    it("refunded (max rank) is not replaced by Released → completed", () => {
      const order = orderRow({ id: "o1", state: "refunded" });
      const cs = chainSyncWithEventType("Released");
      expect(resolveStatusForEscrowBadge(order, cs)).toBe("refunded");
    });
  });
});
