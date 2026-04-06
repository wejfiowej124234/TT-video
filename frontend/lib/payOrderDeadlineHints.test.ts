import { describe, it, expect } from "vitest";
import { computePayDeadlineLines } from "./payOrderDeadlineHints";

const t = (k: string) => {
  const m: Record<string, string> = {
    order_chatConfirmDeadlineHint: "Chat by {{date}}",
    order_paymentDeadlineHint: "Pay by {{date}}",
    pay_deadlineHintsAria: "deadlines",
  };
  return m[k] ?? k;
};

describe("computePayDeadlineLines", () => {
  it("returns payment line when step is pay (accepted+confirmed)", () => {
    const out = computePayDeadlineLines(
      {
        state: "accepted",
        sub_status: "confirmed",
        payment_deadline: "2030-06-01T12:00:00.000Z",
      },
      t
    );
    expect(out?.lines.length).toBe(1);
    expect(out?.lines[0]).toMatch(/^Pay by /);
  });

  it("returns chat line when step is bilateral", () => {
    const out = computePayDeadlineLines(
      {
        state: "accepted",
        sub_status: "pending_bilateral",
        chat_confirm_deadline: "2030-05-01T08:00:00.000Z",
      },
      t
    );
    expect(out?.lines.length).toBe(1);
    expect(out?.lines[0]).toMatch(/^Chat by /);
  });

  it("returns null when no deadlines or wrong step", () => {
    expect(
      computePayDeadlineLines(
        {
          state: "accepted",
          sub_status: "confirmed",
          chat_confirm_deadline: "2030-05-01T08:00:00.000Z",
        },
        t
      )
    ).toBeNull();
    expect(computePayDeadlineLines(null, t)).toBeNull();
  });
});
