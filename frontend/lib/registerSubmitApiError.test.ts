import { describe, expect, it } from "vitest";
import { classifyRegisterSubmitApiError } from "./registerSubmitApiError";

const t = (k: string) => k;

describe("classifyRegisterSubmitApiError", () => {
  it("maps rate_limit_exceeded to rate_limited form code", () => {
    expect(classifyRegisterSubmitApiError(new Error("rate_limit_exceeded"), t)).toEqual({
      kind: "form_code",
      code: "rate_limited",
    });
  });

  it("maps critical_write_rate_limit_exceeded to rate_limited form code", () => {
    expect(classifyRegisterSubmitApiError(new Error("critical_write_rate_limit_exceeded"), t)).toEqual({
      kind: "form_code",
      code: "rate_limited",
    });
  });

  it("maps login_required to register_session_required form code", () => {
    expect(classifyRegisterSubmitApiError(new Error("login_required"), t)).toEqual({
      kind: "form_code",
      code: "register_session_required",
    });
  });

  it("maps FILE_TOO_LARGE to file_too_large form code", () => {
    expect(classifyRegisterSubmitApiError(new Error("FILE_TOO_LARGE"), t)).toEqual({
      kind: "form_code",
      code: "file_too_large",
    });
  });

  it("maps api_html_not_json without unexpected log flag", () => {
    expect(classifyRegisterSubmitApiError(new Error("api_html_not_json"), t)).toEqual({
      kind: "message",
      message: "auth_error_api_html_not_json",
      logAsUnexpected: false,
    });
  });

  it("maps unknown errors via mapApiReadError with unexpected log flag", () => {
    expect(classifyRegisterSubmitApiError(new Error("mystery_code"), t)).toEqual({
      kind: "message",
      message: "auth_register_error_registerFailed",
      logAsUnexpected: true,
    });
  });
});
