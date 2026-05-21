import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  TT_SCENE_DEBUG_HIDE_ORDER,
  applyPageCinematicLayerVisibility,
  collectPageCinematicSceneGraph,
  hiddenLayersForStep,
} from "./traveltrustPageCinematicSceneDebug";

describe("traveltrustPageCinematicSceneDebug", () => {
  it("hide order matches maintainer checklist", () => {
    expect([...TT_SCENE_DEBUG_HIDE_ORDER]).toEqual([
      "warmSkyShell",
      "fog",
      "atmosphere",
      "arcs",
      "ocean",
    ]);
  });

  it("applyPageCinematicLayerVisibility toggles tagged layers cumulatively", () => {
    const scene = new THREE.Scene();
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: 0x0c0a09 }),
    );
    shell.userData.ttSceneDebugLayer = "warmSkyShell";
    scene.add(shell);

    applyPageCinematicLayerVisibility(scene, 1);
    expect(shell.visible).toBe(false);
    expect(hiddenLayersForStep(1).has("warmSkyShell")).toBe(true);

    applyPageCinematicLayerVisibility(scene, 0);
    expect(shell.visible).toBe(true);
  });

  it("collectPageCinematicSceneGraph includes layer and material type", () => {
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1),
      new THREE.MeshBasicMaterial({ color: 0x112233 }),
    );
    mesh.userData.ttSceneDebugLayer = "atmosphere";
    scene.add(mesh);
    const rows = collectPageCinematicSceneGraph(scene);
    expect(rows.some((r) => r.layer === "atmosphere" && r.geometry.type === "PlaneGeometry")).toBe(
      true,
    );
  });
});
