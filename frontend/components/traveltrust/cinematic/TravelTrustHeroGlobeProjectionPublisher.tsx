"use client";

/**
 * P3 · 发布 WebGL 地球自转矩阵 → DOM 装饰层（非冻结 · ①）
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import type { Group } from "three";
import * as THREE from "three";
import {
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  resolveHeroP3HubLatLon,
  type HeroP3DecorNodeTier,
} from "@/lib/traveltrustHeroP3DecorNodes";
import {
  projectGlobeSurfaceToHeroViewport,
  resolveHeroGlobeFacingMinDot,
} from "@/lib/traveltrustHeroGlobeProjectionMath";
import {
  resetHeroGlobeProjectionSnapshot,
  setHeroGlobeProjectionSnapshot,
} from "@/lib/traveltrustHeroGlobeProjectionStore";

const _globeSurfaceMatrix = new THREE.Matrix4();

/** 与贴图球面同源的世界矩阵（含 Float / 倾角组 / globeRig，不仅是自转 spin 组） */
function resolveGlobeSurfaceMatrixWorld(root: Group): boolean {
  let surfaceGroup: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (surfaceGroup) return;
    if (obj.userData?.ttSceneDebugName === "TravelTrustTourismGlobe") {
      surfaceGroup = obj;
    }
  });
  if (!surfaceGroup) return false;
  const surface = surfaceGroup as THREE.Object3D;
  surface.updateWorldMatrix(true, false);
  _globeSurfaceMatrix.copy(surface.matrixWorld);
  return true;
}

export function TravelTrustHeroGlobeProjectionPublisher({
  globeRigRef,
  surfaceRadius,
}: {
  globeRigRef: RefObject<Group | null>;
  surfaceRadius: number;
}) {
  const { camera, gl } = useThree();
  const revisionRef = useRef(0);

  useEffect(() => () => resetHeroGlobeProjectionSnapshot(), []);

  useFrame(() => {
    const rig = globeRigRef.current;
    if (!rig) {
      resetHeroGlobeProjectionSnapshot();
      return;
    }
    if (!resolveGlobeSurfaceMatrixWorld(rig)) {
      resetHeroGlobeProjectionSnapshot();
      return;
    }

    const canvas = gl.domElement;
    const canvasRect = canvas.getBoundingClientRect();
    const viewportEl = document.querySelector('[data-tt-traveltrust-hero-globe-viewport="1"]');
    if (!viewportEl || canvasRect.width < 2 || canvasRect.height < 2) {
      resetHeroGlobeProjectionSnapshot();
      return;
    }
    const viewportRect = viewportEl.getBoundingClientRect();
    if (viewportRect.width < 2 || viewportRect.height < 2) {
      resetHeroGlobeProjectionSnapshot();
      return;
    }

    const points: Record<string, ReturnType<typeof projectGlobeSurfaceToHeroViewport>> = {};
    for (const node of TRAVELTRUST_HERO_P3_DECOR_NODES) {
      const hub = resolveHeroP3HubLatLon(node);
      points[node.id] = projectGlobeSurfaceToHeroViewport(
        hub.lat,
        hub.lon,
        surfaceRadius,
        _globeSurfaceMatrix,
        camera,
        { canvas: canvasRect, viewport: viewportRect },
        resolveHeroGlobeFacingMinDot(node.tier as HeroP3DecorNodeTier),
      );
    }

    revisionRef.current += 1;
    setHeroGlobeProjectionSnapshot({
      revision: revisionRef.current,
      active: true,
      surfaceRadius,
      points,
    });
  });

  return null;
}
