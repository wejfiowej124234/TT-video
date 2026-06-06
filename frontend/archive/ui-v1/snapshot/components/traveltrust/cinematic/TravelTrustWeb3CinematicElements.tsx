"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, PointLight } from "three";
import * as THREE from "three";
import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";
import {
  ROLE_CINEMATIC_3D_COLORS,
  TT_BRAND_3D,
  TT_CINEMATIC_FILM,
  type TravelTrustCinematic3dConfig,
} from "./traveltrustCinematic3dConfig";
import { lerp, lerpHex, smoothstep } from "./traveltrustCinematicEasing3d";
import {
  resolveHeroGlobeOpacityExit,
  resolveHeroGlobeScaleExit,
} from "@/lib/traveltrustHeroCinematicAlign";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";
import { useTravelTrustTheaterRole } from "./TravelTrustTheaterRoleContext";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 全球旅行网络赤道环 — 托管 / 结算轨道意象 */
export function TrustEquatorRing({
  radius,
  color = TT_BRAND_3D.cyan,
  opacity = 0.14,
}: {
  radius: number;
  color?: string;
  opacity?: number;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius * 1.06, 0, Math.sin(a) * radius * 1.06));
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={1}
      data-tt-traveltrust-globe-orbit-ring="equator"
    />
  );
}

/** 双倾角链环 — Web3 多签 / 区域金库网格感 */
export function TrustMeshLattice({
  radius,
  colorA = TT_BRAND_3D.cyan,
  colorB = TT_BRAND_3D.coral,
}: {
  radius: number;
  colorA?: string;
  colorB?: string;
}) {
  const ringA = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const r = radius * 1.14;
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * 0.22 * r, Math.sin(a) * r * 0.55));
    }
    return pts;
  }, [radius]);

  const ringB = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const r = radius * 1.08;
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(a) * r * 0.62, Math.cos(a) * r * 0.38, Math.cos(a) * r));
    }
    return pts;
  }, [radius]);

  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.035;
      group.current.rotation.z += delta * 0.012;
    }
  });

  return (
    <group ref={group}>
      <Line points={ringA} color={colorA} transparent opacity={0.2} lineWidth={1} />
      <Line points={ringB} color={colorB} transparent opacity={0.16} lineWidth={1} />
    </group>
  );
}

const ESCROW_ANCHOR_ANGLES: { role: TravelTrustRoleId; theta: number; phi: number }[] = [
  { role: "traveler", theta: 0.8, phi: 1.2 },
  { role: "guide", theta: 2.4, phi: 0.9 },
  { role: "provider", theta: 4.1, phi: 1.45 },
  { role: "region_steward", theta: 5.5, phi: 0.75 },
];

/** 四角色托管锚点 — 协议四方节点 */
export function EscrowAnchorNodes({
  radius,
  activeRole,
}: {
  radius: number;
  activeRole: TravelTrustRoleId;
}) {
  const group = useRef<Group>(null);
  const pageScroll = useTravelTrustPageScrollProgress();
  const boostRef = useRef(0);

  useFrame((state) => {
    boostRef.current = smoothstep(0.42, 0.68, pageScroll?.get() ?? 0);
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const boost = boostRef.current;
    group.current.children.forEach((child, i) => {
      const base = child.userData.baseScale as number;
      const pulse = base * (1 + Math.sin(t * 2.4 + i * 1.1) * 0.12 * (0.4 + boost * 0.6));
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={group}>
      {ESCROW_ANCHOR_ANGLES.map(({ role, theta, phi }) => {
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        const colors = ROLE_CINEMATIC_3D_COLORS[role];
        const isActive = role === activeRole;
        const scale = isActive ? 0.09 : 0.055;
        return (
          <mesh key={role} position={[x, y, z]} userData={{ baseScale: scale }}>
            <sphereGeometry args={[scale, 8, 8]} />
            <meshBasicMaterial
              color={colors.primary}
              transparent
              opacity={isActive ? 0.52 : 0.18}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function RoutePulse({ curve, speed, color }: { curve: THREE.Curve<THREE.Vector3>; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const trailPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) pts.push(curve.getPointAt(i / 32));
    return pts;
  }, [curve]);

  useFrame((state) => {
    if (!ref.current) return;
    const u = (state.clock.elapsedTime * speed) % 1;
    ref.current.position.copy(curve.getPointAt(u));
    const s = 0.85 + Math.sin(state.clock.elapsedTime * 5) * 0.15;
    ref.current.scale.setScalar(s);
  });
  return (
    <group>
      <Line points={trailPoints} color={color} transparent opacity={0.12} lineWidth={1} />
      <mesh ref={ref}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** 活跃托管锚点 → 赤道环：Escrow 结算路径意象 */
export function TrustEscrowFilaments({
  radius,
  activeRole,
}: {
  radius: number;
  activeRole: TravelTrustRoleId;
}) {
  const heroScroll = useTravelTrustHeroScrollProgress();
  const group = useRef<Group>(null);

  const anchors = useMemo(() => {
    return ESCROW_ANCHOR_ANGLES.map(({ role, theta, phi }) => {
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      const equator = new THREE.Vector3(radius * 1.06 * Math.cos(theta), 0, radius * 1.06 * Math.sin(theta));
      return { role, node: new THREE.Vector3(x, y, z), equator };
    });
  }, [radius]);

  useFrame(() => {
    const heroT = heroScroll?.get() ?? 0;
    if (group.current) {
      const scaleExit = resolveHeroGlobeScaleExit(heroT);
      const opacityExit = resolveHeroGlobeOpacityExit(heroT);
      group.current.visible = opacityExit < 0.99;
      group.current.scale.setScalar(lerp(1, 0.9, scaleExit));
    }
  });

  const active = anchors.find((a) => a.role === activeRole) ?? anchors[0];
  const colors = ROLE_CINEMATIC_3D_COLORS[activeRole];

  return (
    <group ref={group}>
      {anchors.map(({ role, node, equator }) => {
        const isActive = role === activeRole;
        return (
          <Line
            key={`filament-${role}`}
            points={[node, equator]}
            color={isActive ? colors.primary : TT_BRAND_3D.mint}
            transparent
            opacity={isActive ? TT_CINEMATIC_FILM.escrowFilamentOpacity + 0.12 : TT_CINEMATIC_FILM.escrowFilamentOpacity * 0.45}
            lineWidth={1}
          />
        );
      })}
      <Line
        points={[active.node, active.equator]}
        color={colors.pulse}
        transparent
        opacity={0.35}
        lineWidth={1}
      />
    </group>
  );
}

/** 地平线暖光带 — 热带旅行 × Web3 夜幕 */
export function CinematicHorizonBand() {
  const band = useRef<THREE.Mesh>(null);
  const pageScroll = useTravelTrustPageScrollProgress();

  useFrame((state) => {
    if (!band.current) return;
    const t = pageScroll?.get() ?? 0;
    const hero = 1 - smoothstep(0.35, 0.78, t);
    band.current.position.y = lerp(-3.85, -3.1, t);
    const mat = band.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.07 * hero + 0.03 * (1 - hero);
    band.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * 0.02;
  });

  return (
    <mesh ref={band} position={[0, -3.75, -3.4]} rotation={[-Math.PI * 0.38, 0, 0]}>
      <planeGeometry args={[16, 2.2]} />
      <meshBasicMaterial
        color={TT_BRAND_3D.coral}
        transparent
        opacity={0.06}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** 链上路线流光 — 节点间旅行 / 结算脉冲 */
export function RouteTrustPulses({ config, count = 3 }: { config: TravelTrustCinematic3dConfig; count?: number }) {
  const curves = useMemo(() => {
    const r = config.globeRadius;
    return Array.from({ length: count }, (_, i) => {
      const pts: THREE.Vector3[] = [];
      const n0 = Math.floor(seededRandom(i * 3.1) * config.nodeCount);
      const n1 = Math.floor(seededRandom(i * 5.7 + 1) * config.nodeCount);
      for (let s = 0; s <= 24; s++) {
        const u = s / 24;
        const theta = lerp(
          seededRandom(n0) * Math.PI * 2,
          seededRandom(n1) * Math.PI * 2 + Math.PI * 0.3,
          u,
        );
        const phi = lerp(0.35 + seededRandom(n0 + 2) * 1.2, 0.4 + seededRandom(n1 + 4) * 1.1, u);
        pts.push(
          new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi),
          ),
        );
      }
      return new THREE.CatmullRomCurve3(pts);
    });
  }, [config, count]);

  const colors = [TT_BRAND_3D.cyan, TT_BRAND_3D.mint, TT_BRAND_3D.coral];

  return (
    <group>
      {curves.map((curve, i) => (
        <RoutePulse key={`route-${i}`} curve={curve} speed={0.08 + i * 0.025} color={colors[i % colors.length]} />
      ))}
    </group>
  );
}

/** 滚动 + 角色驱动的电影级灯光（品牌青 / 珊瑚 / 薄荷） */
export function PageCinematicLighting() {
  const pageScroll = useTravelTrustPageScrollProgress();
  const { roleId } = useTravelTrustTheaterRole();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const cyanRef = useRef<PointLight>(null);
  const coralRef = useRef<PointLight>(null);
  const mintRef = useRef<PointLight>(null);
  const smooth = useRef<{ cyan: string; coral: string; mint: string; ambient: number }>({
    cyan: TT_BRAND_3D.cyan,
    coral: TT_BRAND_3D.coral,
    mint: TT_BRAND_3D.mint,
    ambient: 0.28,
  });

  useFrame(() => {
    const t = pageScroll?.get() ?? 0;
    const hero = 1 - smoothstep(0.12, 0.58, t);
    const theater = smoothstep(0.4, 0.72, t);
    const role = ROLE_CINEMATIC_3D_COLORS[roleId];
    const targetCyan = lerpHex(TT_BRAND_3D.cyan, role.primary, theater * 0.65);
    const targetCoral = lerpHex(TT_BRAND_3D.coral, role.secondary, theater * 0.55);
    const targetMint = lerpHex(TT_BRAND_3D.mint, role.pulse, theater * 0.4);
    smooth.current.cyan = lerpHex(smooth.current.cyan, targetCyan, 0.06);
    smooth.current.coral = lerpHex(smooth.current.coral, targetCoral, 0.06);
    smooth.current.mint = lerpHex(smooth.current.mint, targetMint, 0.06);
    smooth.current.ambient = lerp(0.28, 0.38, theater);
    if (cyanRef.current) cyanRef.current.color.set(smooth.current.cyan);
    if (coralRef.current) coralRef.current.color.set(smooth.current.coral);
    if (mintRef.current) mintRef.current.color.set(smooth.current.mint);
    if (cyanRef.current) cyanRef.current.intensity = lerp(1.12, 1.28, theater) * lerp(1.08, 0.92, hero);
    if (coralRef.current) coralRef.current.intensity = lerp(0.62, 0.88, theater) * lerp(0.95, 1.05, hero);
    if (mintRef.current) mintRef.current.intensity = lerp(0.38, 0.52, theater);
    if (ambientRef.current) ambientRef.current.intensity = lerp(0.3, smooth.current.ambient, hero);
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.28} />
      <pointLight ref={cyanRef} position={[4, 3, 6]} intensity={1.05} color={TT_BRAND_3D.cyan} />
      <pointLight ref={coralRef} position={[-5, -2, 4]} intensity={0.58} color={TT_BRAND_3D.coral} />
      <pointLight ref={mintRef} position={[0, -3.5, 2]} intensity={0.38} color={TT_BRAND_3D.mint} />
      <pointLight position={[0, 4, -3]} intensity={0.22} color={TT_BRAND_3D.teal} />
    </>
  );
}
