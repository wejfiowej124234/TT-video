import { describe, expect, it } from "vitest";
import { mapOrderWriteError } from "./mapOrderWriteError";
import { MAP_ORDER_WRITE_ERROR_CASES, mapOrderWriteErrorTestT } from "./mapOrderWriteError.vitestShared";

/** 显式矩阵；**`COMMUNITY_LOCALE_FALLTHROUGH_CODES_LIST`** 全量对拍见 **`mapOrderWriteError.localeHttpAndCommunity.test.ts`**。 */
describe("mapOrderWriteError · CASES matrix", () => {
  it.each(MAP_ORDER_WRITE_ERROR_CASES)("maps %s → %s", (code, key) => {
    expect(mapOrderWriteError(new Error(code), mapOrderWriteErrorTestT)).toBe(key);
  });
});
