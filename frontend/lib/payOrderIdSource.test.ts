import { describe, expect, it } from "vitest";
import {
  buildPayHubLoginReturnPath,
  effectivePayHubOrderId,
  PAY_ORDER_ID_UUID_RE,
} from "./payOrderIdSource";

const U = "11111111-1111-4111-8111-111111111111";
const V = "22222222-2222-4222-8222-222222222222";

describe("payOrderIdSource", () => {
  it("accepts sample UUID shape", () => {
    expect(PAY_ORDER_ID_UUID_RE.test(U)).toBe(true);
  });

  it("query UUID wins over different input (B-032)", () => {
    expect(effectivePayHubOrderId(U, V)).toBe(U);
  });

  it("invalid query defers to input", () => {
    expect(effectivePayHubOrderId("not-a-uuid", V)).toBe(V);
    expect(effectivePayHubOrderId("", V)).toBe(V);
  });

  it("empty both", () => {
    expect(effectivePayHubOrderId("", "")).toBe("");
  });
});

describe("buildPayHubLoginReturnPath", () => {
  const U = "11111111-1111-4111-8111-111111111111";

  it("forces orderId when effective UUID present", () => {
    expect(buildPayHubLoginReturnPath("/pay", "", U)).toBe(`/pay?orderId=${U}`);
  });

  it("overwrites invalid orderId in query with effective UUID", () => {
    expect(buildPayHubLoginReturnPath("/pay", "orderId=bad", U)).toBe(`/pay?orderId=${U}`);
  });

  it("preserves other params and adds orderId", () => {
    expect(buildPayHubLoginReturnPath("/pay", "x=1", U)).toBe(`/pay?x=1&orderId=${U}`);
  });

  it("no orderId param when effective id empty", () => {
    expect(buildPayHubLoginReturnPath("/pay", "", "")).toBe("/pay");
    expect(buildPayHubLoginReturnPath("/pay", "foo=bar", "")).toBe("/pay?foo=bar");
  });

  it("defaults base to /pay when pathname missing", () => {
    expect(buildPayHubLoginReturnPath(null, "", U)).toBe(`/pay?orderId=${U}`);
  });
});
