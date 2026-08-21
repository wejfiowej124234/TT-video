import { describe, expect, it } from "vitest";
import {
  TT_DOM_OUTLINE_QUERY,
  applyTraveltrustDomLayoutOutlineDebug,
  shouldMountTraveltrustDomLayoutDebug,
} from "./traveltrustDomLayoutDebug";

describe("traveltrustDomLayoutDebug", () => {
  it("enables outline mode only with tt_dom_outline query", () => {
    expect(TT_DOM_OUTLINE_QUERY).toBe("tt_dom_outline");
    expect(shouldMountTraveltrustDomLayoutDebug()).toBe(false);
  });

  it("outlines elements with non-transparent backgroundColor", () => {
    document.body.innerHTML = `<div id="opaque" style="background:#0b1220"></div><div id="clear"></div>`;
    applyTraveltrustDomLayoutOutlineDebug(document.body);
    const opaque = document.getElementById("opaque")!;
    const clear = document.getElementById("clear")!;
    expect(opaque.style.outline).toContain("2px solid red");
    expect(opaque.dataset.ttDomOutlineBg).toBeTruthy();
    expect(clear.style.outline).toBe("");
  });
});
