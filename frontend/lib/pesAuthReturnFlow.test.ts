import { describe, expect, it } from "vitest";
import {
  PES_AUTH_INTENT_PARAM,
  buildPesAuthHref,
  parsePesAuthIntent,
} from "./pesAuthReturnFlow";

describe("pesAuthReturnFlow", () => {
  it("builds login href with returnUrl and pes_intent", () => {
    const href = buildPesAuthHref("login", "/orders", "order", "/orders");
    expect(href).toContain("/auth/login");
    expect(href).toContain("returnUrl=%2Forders");
    expect(href).toContain(`${PES_AUTH_INTENT_PARAM}=order`);
  });

  it("builds register href preserving community publish return", () => {
    const href = buildPesAuthHref("register", "/community?publish=1", "post", "/community");
    expect(href).toContain("/auth/register");
    expect(href).toContain(encodeURIComponent("/community?publish=1"));
    expect(href).toContain(`${PES_AUTH_INTENT_PARAM}=post`);
  });

  it("parses pes_intent from query string", () => {
    expect(parsePesAuthIntent(`?${PES_AUTH_INTENT_PARAM}=identity`)).toBe("identity");
    expect(parsePesAuthIntent("?foo=bar")).toBeNull();
  });
});
