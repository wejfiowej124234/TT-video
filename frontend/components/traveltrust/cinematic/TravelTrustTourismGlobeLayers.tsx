"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */

import { Line, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import { TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH } from "@/lib/traveltrustGlobeEarthAsset";
import { createTraveltrustGlobeNightLightsTextureProcedural } from "@/lib/traveltrustGlobeEarthTexture";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { TRAVELTRUST_GLOBE_SUN_DIR } from "@/lib/traveltrustGlobeSun";
import {
  TRAVELTRUST_PHASE1_GLOBE_REGIONS,
  latLonToUnitVector,
} from "@/lib/traveltrustPhase1GlobeRegions";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { TT_BRAND_3D } from "./traveltrustCinematic3dConfig";

const FRESNEL_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const FRESNEL_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPower;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  float f = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uPower);
  gl_FragColor = vec4(uColor, f * uIntensity);
}
`;

const NIGHT_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalWorld;
void main() {
  vUv = uv;
  vNormalWorld = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const NIGHT_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uSunDir;
uniform float uStrength;
varying vec2 vUv;
varying vec3 vNormalWorld;
void main() {
  float ndl = dot(normalize(vNormalWorld), normalize(uSunDir));
  if (ndl > -0.06) discard;
  vec4 tex = texture2D(uMap, vUv);
  float night = smoothstep(0.0, -0.4, ndl);
  gl_FragColor = vec4(tex.rgb, tex.a * uStrength * night);
}
`;

function useFresnelMaterial(
  color: string,
  intensity: number,
  power: number,
  blending: THREE.Blending = THREE.AdditiveBlending,
) {
  return useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uIntensity: { value: intensity },
        uPower: { value: power },
      },
      vertexShader: FRESNEL_VERT,
      fragmentShader: FRESNEL_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      side: THREE.BackSide,
    });
  }, [blending, color, intensity, power]);
}

function useWarmFresnelMaterial() {
  const v = TT_CINEMATIC_GLOBE_VISUAL;
  return useFresnelMaterial(v.fresnelColor, v.fresnelIntensity, v.fresnelPower);
}

/** 极薄 forward 雾（L5 · 非玻璃球外壳） */
export function TourismGlobeAtmosphereHaze({ radius }: { radius: number }) {
  const v = TT_CINEMATIC_GLOBE_VISUAL;
  if (v.atmosphereHazeOpacity <= 0.001) return null;
  return (
    <mesh scale={radius * 1.005}>
      <sphereGeometry args={[1, 40, 40]} />
      <meshBasicMaterial
        color={v.atmosphereHazeColor}
        transparent
        opacity={v.atmosphereHazeOpacity}
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/** L5 · 极薄昼侧蓝大气边（BackSide Fresnel · 非整球染色） */
export function TourismGlobeDaylightAtmosphereRim({ radius }: { radius: number }) {
  const v = TT_CINEMATIC_GLOBE_VISUAL;
  const mat = useFresnelMaterial(
    v.atmosphereDaylightRimColor,
    v.atmosphereDaylightRimIntensity,
    v.atmosphereDaylightRimPower,
    THREE.AdditiveBlending,
  );
  if (v.atmosphereDaylightRimIntensity <= 0.001) return null;
  return (
    <mesh scale={radius * 1.012} material={mat}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
}

/** Additive Fresnel rim — replaces flat cyan ring (L4+). */
export function TourismGlobeFresnelRim({ radius }: { radius: number }) {
  const mat = useWarmFresnelMaterial();
  return (
    <mesh scale={radius * 1.028} material={mat}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
}

/** Slow-drifting cloud shell (casts soft shadow read on earth via alpha). */
export function TourismGlobeCloudLayer({
  radius,
  segments,
  opacityScale = 1,
}: {
  radius: number;
  segments: number;
  /** Hero 暖墨首屏：减薄云以免盖球 */
  opacityScale?: number;
}) {
  const cloudRef = useRef<Mesh>(null);
  const map = useTexture(TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH, undefined, undefined, "anonymous");

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;
  }, [map]);

  useFrame((_, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += delta * TT_CINEMATIC_GLOBE_VISUAL.cloudDriftSpeed;
  });

  const v = TT_CINEMATIC_GLOBE_VISUAL;

  return (
    <mesh ref={cloudRef} scale={radius * 1.014}>
      <sphereGeometry args={[1, segments, segments]} />
      <meshStandardMaterial
        map={map}
        color="#f2ebe0"
        transparent
        opacity={v.cloudOpacity * opacityScale}
        depthWrite={false}
        roughness={v.cloudRoughness}
        metalness={0}
        toneMapped
      />
    </mesh>
  );
}

/** Night-side city lights (shader-masked emissive · decorative). */
export function TourismGlobeNightLights({
  radius,
  segments,
  strengthScale = 1,
}: {
  radius: number;
  segments: number;
  /** Hero 首屏缩放 `nightLightsStrength`（earth-realism pass） */
  strengthScale?: number;
}) {
  const nightMap = useMemo(() => createTraveltrustGlobeNightLightsTextureProcedural(), []);
  useEffect(() => () => nightMap.dispose(), [nightMap]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: nightMap },
        uSunDir: { value: TRAVELTRUST_GLOBE_SUN_DIR.clone() },
        uStrength: { value: TT_CINEMATIC_GLOBE_VISUAL.nightLightsStrength * strengthScale },
      },
      vertexShader: NIGHT_VERT,
      fragmentShader: NIGHT_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [nightMap]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh scale={radius * 1.002}>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/** Thin brand glass shell (~30% Web3 polish). */
export function TourismGlobeGlassShell({ radius }: { radius: number }) {
  const v = TT_CINEMATIC_GLOBE_VISUAL;
  return (
    <mesh scale={radius * 1.052}>
      <sphereGeometry args={[1, 40, 40]} />
      <meshPhysicalMaterial
        color="#ffd4a8"
        transparent
        opacity={v.glassShellOpacity}
        transmission={v.glassTransmission}
        thickness={0.15}
        roughness={0.15}
        metalness={0}
        ior={1.2}
        depthWrite={false}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Faint holographic lat/lon — protocol accent without wireframe ball. */
export function TourismGlobeHoloGrid({ radius }: { radius: number }) {
  const lines = useMemo(() => {
    const r = radius * 1.021;
    const segments: { points: [number, number, number][]; key: string }[] = [];

    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: [number, number, number][] = [];
      const phi = ((90 - lat) * Math.PI) / 180;
      const y = r * Math.cos(phi);
      const ringR = r * Math.sin(phi);
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push([Math.cos(a) * ringR, y, Math.sin(a) * ringR]);
      }
      segments.push({ points: pts, key: `lat-${lat}` });
    }

    for (let lon = 0; lon < 360; lon += 45) {
      const pts: [number, number, number][] = [];
      const lambda = (lon * Math.PI) / 180;
      for (let i = 0; i <= 48; i++) {
        const phi = (i / 48) * Math.PI;
        const x = r * Math.sin(phi) * Math.cos(lambda);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(lambda);
        pts.push([x, y, z]);
      }
      segments.push({ points: pts, key: `lon-${lon}` });
    }

    return segments;
  }, [radius]);

  const v = TT_CINEMATIC_GLOBE_VISUAL;

  return (
    <group>
      {lines.map((seg) => (
        <Line
          key={seg.key}
          points={seg.points}
          color="#e8b88a"
          transparent
          opacity={v.holoGridOpacity}
          lineWidth={0.6}
        />
      ))}
    </group>
  );
}

/** Soft motes anchored on Phase1 land hubs (L5 · no open-ocean drift). */
export function TourismGlobeAmbientParticles({ radius }: { radius: number }) {
  const group = useRef<Group>(null);
  const particles = useMemo(() => {
    const count = TT_CINEMATIC_GLOBE_VISUAL.ambientParticleCount;
    const data: { pos: THREE.Vector3; scale: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      const region = TRAVELTRUST_PHASE1_GLOBE_REGIONS[i % TRAVELTRUST_PHASE1_GLOBE_REGIONS.length]!;
      const hub = resolveTraveltrustHubLatLon(region);
      const [ux, uy, uz] = latLonToUnitVector(hub.lat, hub.lon);
      const v = new THREE.Vector3(ux, uy, uz);
      v.applyAxisAngle(new THREE.Vector3(0, 1, 0), ((i % 5) - 2) * 0.04);
      const dist = radius * (1.026 + (i % 2) * 0.01);
      data.push({
        pos: v.normalize().multiplyScalar(dist),
        scale: 0.01 + (i % 3) * 0.003,
        phase: i * 0.7,
      });
    }
    return data;
  }, [radius]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      child.position.y = p.pos.y + Math.sin(t * 0.5 + p.phase) * 0.06;
      const s = p.scale * (1 + Math.sin(t * 1.2 + p.phase) * 0.2);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[p.scale, 6, 6]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? "#ffd4a8" : "#ffe8c8"}
            transparent
            opacity={0.26}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
