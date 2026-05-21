"use client";

import { Float, Line, Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Group, Mesh, PerspectiveCamera } from "three";
import * as THREE from "three";
import { TRAVELTRUST_HERO_DEFAULT_POSTER } from "@/app/traveltrust/traveltrustIdentityModel";
import { resolveTraveltrustGlobeRenderTier } from "@/lib/traveltrustGlobeEarthAsset";
import { TT_LEGACY_3D_CONTENT_L5 } from "@/lib/traveltrustCinematicNonGlobeL5";
import { TT_CINEMATIC_ATMOSPHERE, TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { TravelTrustPhase1GlobeHighlights } from "./TravelTrustPhase1GlobeHighlights";
import { TravelTrustPhase1TravelArcs } from "./TravelTrustPhase1TravelArcs";
import {
  TravelTrustTourismGlobe,
  TravelTrustTourismGlobeFillLight,
  TravelTrustTourismGlobeSpin,
} from "./TravelTrustTourismGlobe";
import {
  TT_BRAND_3D,
  TT_CINEMATIC_3D_BG,
  TT_CINEMATIC_NODE_COLORS,
  type TravelTrustCinematic3dConfig,
} from "./traveltrustCinematic3dConfig";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function spherePoint(radius: number, i: number): THREE.Vector3 {
  const u = seededRandom(i * 1.7 + 0.3);
  const v = seededRandom(i * 2.1 + 0.9);
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  );
}

function CinematicCameraRig() {
  const scrollMv = useTravelTrustHeroScrollProgress();
  const { camera } = useThree();
  const smooth = useRef({ z: 7.2, y: 0.2, fov: 48 });

  useFrame(() => {
    const t = scrollMv?.get() ?? 0;
    const targetZ = 7.2 - t * 2.4;
    const targetY = 0.2 + t * 0.65;
    const targetFov = 48 - t * 7;
    smooth.current.z += (targetZ - smooth.current.z) * 0.07;
    smooth.current.y += (targetY - smooth.current.y) * 0.07;
    smooth.current.fov += (targetFov - smooth.current.fov) * 0.07;
    camera.position.z = smooth.current.z;
    camera.position.y = smooth.current.y;
    const cam = camera as PerspectiveCamera;
    if (cam.fov !== undefined) {
      cam.fov = smooth.current.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

function TravelPulse({ curve, speed, color }: { curve: THREE.Curve<THREE.Vector3>; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const u = (state.clock.elapsedTime * speed) % 1;
    ref.current.position.copy(curve.getPointAt(u));
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.25);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.048, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** 品牌海报球壳 + 大气层（TT-PH1-158 · ① 贴图增强，非实拍） */
export function GlobeBrandAtmosphere({ radius, opacity = 0.2 }: { radius: number; opacity?: number }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(TRAVELTRUST_HERO_DEFAULT_POSTER);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
  <>
      <mesh scale={radius * 1.014}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh scale={radius * 1.06}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.cyan}
          transparent
          opacity={TT_CINEMATIC_ATMOSPHERE.brandShellHaloOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

export function GlobeGlowHalo({ radius, intensity = 1 }: { radius: number; intensity?: number }) {
  const inner = useRef<THREE.Mesh>(null);
  const outer = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const breath = 1 + Math.sin(state.clock.elapsedTime * 0.55) * 0.04;
    const scale = intensity;
    if (inner.current) inner.current.scale.setScalar(radius * (1.12 + 0.1 * scale) * breath);
    if (outer.current) outer.current.scale.setScalar(radius * (1.22 + 0.12 * scale) * (1 + Math.sin(state.clock.elapsedTime * 0.38 + 1) * 0.02));
  });

  return (
    <>
      <mesh ref={inner}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.cyan}
          transparent
          opacity={0.045 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={outer}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.coral}
          transparent
          opacity={0.018 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh scale={radius * (1.28 + 0.2 * intensity)}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.mint}
          transparent
          opacity={0.014 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

function ScrollSceneRig({ children }: { children: ReactNode }) {
  const scrollMv = useTravelTrustHeroScrollProgress();
  const rig = useRef<Group>(null);
  useFrame(() => {
    if (!rig.current) return;
    const t = scrollMv?.get() ?? 0;
    rig.current.position.y = t * 1.35;
    const s = 1 - t * 0.18;
    rig.current.scale.set(s, s, s);
  });
  return <group ref={rig}>{children}</group>;
}

export function OrbitalArcs({ config }: { config: TravelTrustCinematic3dConfig }) {
  const groupRef = useRef<Group>(null);

  const arcs = useMemo(() => {
    const r = config.globeRadius * 1.18;
    return Array.from({ length: config.orbitalArcs }, (_, i) => {
      const tilt = (i / config.orbitalArcs) * Math.PI * 0.85 + 0.2;
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 48; s++) {
        const a = (s / 48) * Math.PI * 1.35 - Math.PI * 0.2;
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * r * (1 + i * 0.04),
            Math.sin(tilt) * 0.55 + Math.sin(a * 2) * 0.12,
            Math.sin(a) * r * 0.72,
          ),
        );
      }
      return pts;
    });
  }, [config]);

  const pulseCurves = useMemo(() => {
    return arcs.slice(0, 2).map((pts) => {
      return new THREE.CatmullRomCurve3(pts.length > 3 ? pts : [new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    });
  }, [arcs]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {arcs.map((pts, i) => (
        <Line
          key={`arc-${i}`}
          points={pts}
          color={i % 2 === 0 ? TT_LEGACY_3D_CONTENT_L5.arcPrimary : TT_LEGACY_3D_CONTENT_L5.arcSecondary}
          transparent
          opacity={0.22 + i * 0.04}
          lineWidth={1}
        />
      ))}
      {pulseCurves[0] ? <TravelPulse curve={pulseCurves[0]} speed={0.11} color="#ffffff" /> : null}
      {pulseCurves[1] ? (
        <TravelPulse curve={pulseCurves[1]} speed={0.07} color={TT_LEGACY_3D_CONTENT_L5.pulseSecondary} />
      ) : null}
    </group>
  );
}

export function TravelGlobeNetwork({
  config,
  showOrbitalArcs = true,
}: {
  config: TravelTrustCinematic3dConfig;
  showOrbitalArcs?: boolean;
}) {
  const group = useRef<Group>(null);
  const nodeRefs = useRef<Mesh[]>([]);

  const { nodes, segments } = useMemo(() => {
    const positions = Array.from({ length: config.nodeCount }, (_, i) => spherePoint(config.globeRadius, i));
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) <= config.maxConnectionDist) {
          pairs.push([positions[i], positions[j]]);
        }
      }
    }
    return { nodes: positions, segments: pairs };
  }, [config]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * config.autoRotateSpeed;
    }
    const t = state.clock.elapsedTime;
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pulse = 1 + Math.sin(t * 2.2 + i * 0.7) * TT_CINEMATIC_GLOBE_VISUAL.nodePulseAmplitude;
      mesh.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[config.globeRadius * 0.992, 56, 56]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.teal}
          transparent
          opacity={TT_CINEMATIC_GLOBE_VISUAL.coreFillOpacity}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[config.globeRadius, 52, 52]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.teal}
          wireframe
          transparent
          opacity={TT_CINEMATIC_GLOBE_VISUAL.wireframeInnerOpacity}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[config.globeRadius * 1.045, 56, 56]} />
        <meshBasicMaterial
          color={TT_BRAND_3D.cyan}
          wireframe
          transparent
          opacity={TT_CINEMATIC_GLOBE_VISUAL.wireframeOuterOpacity}
          depthWrite={false}
        />
      </mesh>
      {nodes.map((p, i) => (
        <mesh
          key={`node-${i}`}
          ref={(el) => {
            if (el) nodeRefs.current[i] = el;
          }}
          position={p}
        >
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial
            color={TT_CINEMATIC_NODE_COLORS[i % TT_CINEMATIC_NODE_COLORS.length]}
            transparent
            opacity={TT_CINEMATIC_GLOBE_VISUAL.nodeOpacity}
            toneMapped={false}
          />
        </mesh>
      ))}
      {segments.map(([a, b], i) => (
        <Line
          key={`seg-${i}`}
          points={[a, b]}
          color={TT_CINEMATIC_NODE_COLORS[i % TT_CINEMATIC_NODE_COLORS.length]}
          transparent
          opacity={TT_CINEMATIC_GLOBE_VISUAL.segmentOpacity}
          lineWidth={1}
        />
      ))}
      {showOrbitalArcs ? <OrbitalArcs config={config} /> : null}
    </group>
  );
}

export function DepthDust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      spd[i * 3] = (Math.random() - 0.5) * 0.014;
      spd[i * 3 + 1] = Math.random() * 0.009 + 0.004;
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.012;
    }
    return { positions: pos, speeds: spd };
  }, [count]);

  useFrame((_, delta) => {
    if (!points.current) return;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += speeds[i * 3] * 60 * delta;
      arr[i * 3 + 1] += speeds[i * 3 + 1] * 60 * delta;
      arr[i * 3 + 2] += speeds[i * 3 + 2] * 60 * delta;
      if (arr[i * 3 + 1] > 7) arr[i * 3 + 1] = -7;
      if (arr[i * 3 + 1] < -7) arr[i * 3 + 1] = 7;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.048}
        color="#ffd4a8"
        transparent
        opacity={0.32}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function ParallaxRig({ strength, children }: { strength: number; children: ReactNode }) {
  const group = useRef<Group>(null);
  const smooth = useRef({ x: 0, y: 0 });
  const scrollMv = useTravelTrustHeroScrollProgress();
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current || strength <= 0) return;
    const scrollT = scrollMv?.get() ?? 0;
    const tx = -pointer.x * strength * (1 - scrollT * 0.5);
    const ty = -pointer.y * strength * 0.65 * (1 - scrollT * 0.5);
    smooth.current.x += (tx - smooth.current.x) * 0.06;
    smooth.current.y += (ty - smooth.current.y) * 0.06;
    group.current.position.x = smooth.current.x;
    group.current.position.y = smooth.current.y;
    group.current.rotation.x = scrollT * 0.18;
  });

  return <group ref={group}>{children}</group>;
}

export function TravelTrustCinematicScene3DContent({
  config,
  enableGlow = true,
  isMobile = false,
}: {
  config: TravelTrustCinematic3dConfig;
  enableGlow?: boolean;
  isMobile?: boolean;
}) {
  const globeTier = resolveTraveltrustGlobeRenderTier({ isMobile, lowQuality: !enableGlow });
  return (
    <>
      <color attach="background" args={[TT_CINEMATIC_3D_BG]} />
      <fog attach="fog" args={[TT_CINEMATIC_3D_BG, 5.5, 18]} />
      <CinematicCameraRig />
      <ambientLight intensity={0.32} />
      <pointLight position={[4, 3, 6]} intensity={1} color={TT_LEGACY_3D_CONTENT_L5.keyLight} />
      <pointLight position={[-5, -2, 4]} intensity={0.55} color={TT_LEGACY_3D_CONTENT_L5.fillLight} />
      <pointLight position={[0, -4, 2]} intensity={0.35} color={TT_LEGACY_3D_CONTENT_L5.rimLight} />
      <Stars
        radius={42}
        depth={28}
        count={config.starCount}
        factor={3.8}
        saturation={0.15}
        fade
        speed={0.35}
      />
      <DepthDust count={config.dustCount} />
      <ScrollSceneRig>
        <ParallaxRig strength={config.parallaxStrength}>
          <Float speed={1.05} rotationIntensity={0.14} floatIntensity={0.22}>
            <group position={[0, -0.12, 0]} rotation={[0.2, 0.42, 0]}>
              {enableGlow ? (
                <GlobeGlowHalo
                  radius={config.globeRadius}
                  intensity={TT_CINEMATIC_ATMOSPHERE.glowHaloIntensity}
                />
              ) : null}
              <TravelTrustTourismGlobeFillLight radius={config.globeRadius} />
              <TravelTrustTourismGlobeSpin config={config}>
                <TravelTrustTourismGlobe
                  config={config}
                  tier={globeTier}
                  isMobile={isMobile}
                  lowQuality={!enableGlow}
                />
                {enableGlow ? (
                  <>
                    <TravelTrustPhase1TravelArcs
                      radius={config.globeRadius}
                      lite={globeTier.travelArcLite}
                    />
                    <TravelTrustPhase1GlobeHighlights radius={config.globeRadius} />
                  </>
                ) : null}
              </TravelTrustTourismGlobeSpin>
            </group>
          </Float>
        </ParallaxRig>
      </ScrollSceneRig>
    </>
  );
}
