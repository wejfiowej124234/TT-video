import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { projectGlobeSurfaceToHeroViewport } from "./traveltrustHeroGlobeProjectionMath";

describe("traveltrustHeroGlobeProjectionMath", () => {
  it("hides back hemisphere and maps front hub into viewport percent", () => {
    const camera = new THREE.PerspectiveCamera(47, 1.6, 0.1, 28);
    camera.position.set(0, 0.4, 7.55);
    camera.updateMatrixWorld(true);

    const facingCamera = new THREE.Matrix4().makeRotationY(0.52);
    const facingAway = new THREE.Matrix4().makeRotationY(0.52 + Math.PI);
    const rects = {
      canvas: { left: 0, top: 0, width: 1200, height: 800, right: 1200, bottom: 800 } as DOMRect,
      viewport: { left: 40, top: 120, width: 520, height: 520, right: 560, bottom: 640 } as DOMRect,
    };

    const surfaceR = 0.998;
    const usFront = projectGlobeSurfaceToHeroViewport(40.7, -74, surfaceR, facingCamera, camera, rects, 0.08);
    const usBack = projectGlobeSurfaceToHeroViewport(40.7, -74, surfaceR, facingAway, camera, rects, 0.08);

    expect(usFront.facingDot).toBeGreaterThan(0.12);
    expect(usFront.edgeFade).toBeGreaterThan(0.1);
    expect(usBack.facingDot).toBeLessThan(0.08);
    expect(usBack.visible).toBe(false);
  });
});
