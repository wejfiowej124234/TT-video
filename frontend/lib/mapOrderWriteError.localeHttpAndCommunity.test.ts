import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import { COMMUNITY_LOCALE_FALLTHROUGH_CODES_LIST } from "./communityApiMessageCodes";
import { mapOrderWriteError } from "./mapOrderWriteError";
import { mapOrderWriteErrorTestT } from "./mapOrderWriteError.vitestShared";

const t = mapOrderWriteErrorTestT;

describe("mapOrderWriteError · community fallthrough & HTTP & zh", () => {
  it.each(COMMUNITY_LOCALE_FALLTHROUGH_CODES_LIST)("maps community fallthrough %s → community_api_msg_*", (code) => {
    expect(mapOrderWriteError(new Error(code), t)).toBe(`community_api_msg_${code}`);
  });

  it("maps file_too_large|max_bytes=… to zh copy with MB hint", () => {
    const dict = zh as Record<string, string>;
    const tZh = (k: string) => dict[k] ?? k;
    expect(mapOrderWriteError(new Error("file_too_large|max_bytes=524288"), tZh)).toContain("0.5");
  });

  it("maps request_failed_<HTTP> placeholders (shared with admin envelope)", () => {
    expect(mapOrderWriteError(new Error("request_failed_401"), t)).toBe("order_error_login_required");
    expect(mapOrderWriteError(new Error("request_failed_403"), t)).toBe("order_error_forbidden");
    expect(mapOrderWriteError(new Error("request_failed_404"), t)).toBe("common_apiHttpNotFound");
    expect(mapOrderWriteError(new Error("request_failed_409"), t)).toBe("common_apiHttpConflict");
    expect(mapOrderWriteError(new Error("request_failed_422"), t)).toBe("common_apiHttpInvalid");
    expect(mapOrderWriteError(new Error("request_failed_408"), t)).toBe("common_apiHttpServer");
    expect(mapOrderWriteError(new Error("request_failed_429"), t)).toBe("common_apiRateLimitExceeded");
    expect(mapOrderWriteError(new Error("request_failed_502"), t)).toBe("common_apiHttpServer");
    expect(mapOrderWriteError(new Error("request_failed_400"), t)).toBe("common_apiHttpInvalid");
    expect(mapOrderWriteError(new Error("request_failed_501"), t)).toBe("common_apiNotImplemented");
  });
});
