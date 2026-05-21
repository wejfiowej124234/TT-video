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

function resolveGlobeSpinGroup(root: Group): Group | null {
  let spin: Group | null = null;
  root.traverse((obj) => {
    if (spin) return;
    if (obj.userData?.ttSceneDebugName === "TravelTrustTourismGlobe" && obj.parent) {
      spin = obj.parent as Group;
    }
  });
  return spin;
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
    const spinGroup = resolveGlobeSpinGroup(rig);
    if (!spinGroup) {
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

    spinGroup.updateWorldMatrix(true, false);
    _globeSurfaceMatrix.copy(spinGroup.matrixWorld);

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
