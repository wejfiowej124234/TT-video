import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import {
  applyTravelTrustInteractiveCanvasGl,
  applyTravelTrustPageCinematicClear,
  applyTravelTrustPageCinematicGl,
  applyTravelTrustPassiveCanvasGl,
} from "./traveltrustCinematicCanvasPassive";
import { TT_CINEMATIC_3D_BG } from "./traveltrustCinematic3dConfig";

function mockGl() {
  const el = document.createElement("canvas");
  return {
    domElement: el,
    setClearColor: vi.fn(),
    setClearAlpha: vi.fn(),
  };
}

describe("traveltrustCinematicCanvasPassive", () => {
  it("applyTravelTrustPageCinematicClear uses page ink (#0c0a09) with opaque alpha", () => {
    const gl = mockGl();
    applyTravelTrustPageCinematicClear(gl);
    expect(gl.setClearColor).toHaveBeenCalledTimes(1);
    const [color, alpha] = gl.setClearColor.mock.calls[0] as [THREE.Color, number];
    expect(color.getHexString()).toBe(TT_CINEMATIC_3D_BG.replace("#", ""));
    expect(alpha).toBe(1);
    expect(gl.setClearAlpha).toHaveBeenCalledWith(1);
    expect(gl.domElement.style.backgroundColor.replace(/\s/g, "")).toMatch(/^(#0c0a09|rgb\(12,10,9\))$/);
  });

  it("applyTravelTrustInteractiveCanvasGl also sets clear color (not passive-only)", () => {
    const gl = mockGl();
    applyTravelTrustInteractiveCanvasGl(gl);
    expect(gl.setClearColor).toHaveBeenCalledTimes(1);
    expect(gl.setClearAlpha).toHaveBeenCalledWith(1);
    expect(gl.domElement.style.pointerEvents).toBe("auto");
  });

  it("applyTravelTrustPassiveCanvasGl sets clear color and disables pointer events", () => {
    const gl = mockGl();
    applyTravelTrustPassiveCanvasGl(gl);
    expect(gl.setClearColor).toHaveBeenCalledTimes(1);
    expect(gl.domElement.style.pointerEvents).toBe("none");
  });

  it("applyTravelTrustPageCinematicGl toggles pointer events for interactive globe", () => {
    const gl = mockGl();
    applyTravelTrustPageCinematicGl(gl, { interactive: true });
    expect(gl.domElement.style.pointerEvents).toBe("auto");
    applyTravelTrustPageCinematicGl(gl, { interactive: false });
    expect(gl.domElement.style.pointerEvents).toBe("none");
  });
});
