import { describe, expect, it } from "vitest";
import { normalizeRegisterVerificationCode } from "@/app/auth/register/RegisterVerificationCodeField";

describe("normalizeRegisterVerificationCode", () => {
  it("keeps contiguous six digits", () => {
    expect(normalizeRegisterVerificationCode("659572")).toBe("659572");
  });

  it("strips spaces and nbsp from mail copy so paste works", () => {
    expect(normalizeRegisterVerificationCode("6 5 9 5 7 2")).toBe("659572");
    expect(normalizeRegisterVerificationCode("6\u00a05\u00a09\u00a05\u00a07\u00a02")).toBe("659572");
  });

  it("ignores letters and truncates to six", () => {
    expect(normalizeRegisterVerificationCode("code: 659572-x")).toBe("659572");
    expect(normalizeRegisterVerificationCode("1234567890")).toBe("123456");
  });
});
