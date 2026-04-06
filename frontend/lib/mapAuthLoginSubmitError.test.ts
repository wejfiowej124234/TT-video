import { describe, expect, it } from "vitest";
import { mapAuthLoginSubmitError } from "./mapAuthLoginSubmitError";

const t = (k: string) => k;

describe("mapAuthLoginSubmitError", () => {
  it("maps invalid_credentials to login-specific i18n key", () => {
    expect(mapAuthLoginSubmitError(new Error("invalid_credentials"), t)).toBe("auth_login_error_invalidCredentials");
  });

  it("maps login_required to login-specific i18n key", () => {
    expect(mapAuthLoginSubmitError(new Error("login_required"), t)).toBe("auth_login_error_testAccountHint");
  });

  it("maps auth_db_persist_failed to login-specific i18n key", () => {
    expect(mapAuthLoginSubmitError(new Error("auth_db_persist_failed"), t)).toBe("auth_login_error_dbUnavailable");
  });

  it("delegates other codes to mapApiReadError with login fallback", () => {
    expect(mapAuthLoginSubmitError(new Error("not_found"), t)).toBe("common_apiHttpNotFound");
  });

  it("uses login fallback for unknown errors", () => {
    expect(mapAuthLoginSubmitError(new Error("mystery"), t)).toBe("auth_login_error_failed");
  });
});
