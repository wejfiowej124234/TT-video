"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  SCIFI_BG_HEX,
  SCIFI_GLOW_HEX,
  type Web3SciFiBackgroundConfig,
} from "./web3SciFiBackgroundConfig";
import { WEB3_SCIFI_NOISE_FRAG, WEB3_SCIFI_NOISE_VERT } from "./web3SciFiShaders";

function GradientPlane() {
  return (
    <mesh position={[0, 0, -0.5]} scale={[24, 24, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={new THREE.Color(SCIFI_BG_HEX)} depthWrite={true} />
    </mesh>
  );
}

function NoisePlane({ speed, opacity }: { speed: number; opacity: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: WEB3_SCIFI_NOISE_VERT,
      fragmentShader: WEB3_SCIFI_NOISE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [speed, opacity]);

  useFrame((_, delta) => {
    if (mat.uniforms.uTime) mat.uniforms.uTime.value += delta * 60;
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]} scale={[24, 24, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function ParticleField({
  count,
  opacity,
  enableBloom,
}: {
  count: number;
  opacity: number;
  enableBloom: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      spd[i * 3] = (Math.random() - 0.5) * 0.02;
      spd[i * 3 + 1] = Math.random() * 0.015 + 0.005;
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, spd];
  }, [count]);

  useFrame((_, delta) => {
    if (!points.current) return;
    const pos = points.current.geometry.attributes.position?.array as Float32Array;
    if (!pos) return;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += speeds[i * 3] * 60 * delta;
      pos[i * 3 + 1] += speeds[i * 3 + 1] * 60 * delta;
      pos[i * 3 + 2] += speeds[i * 3 + 2] * 60 * delta;
      if (pos[i * 3 + 1] > 12) pos[i * 3 + 1] = -12;
      if (pos[i * 3 + 1] < -12) pos[i * 3 + 1] = 12;
      if (pos[i * 3] > 12) pos[i * 3] = -12;
      if (pos[i * 3] < -12) pos[i * 3] = 12;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  const size = enableBloom ? 0.12 : 0.08;
  const color = new THREE.Color(SCIFI_GLOW_HEX);

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function ParallaxGroup({
  children,
  strength,
}: {
  children: React.ReactNode;
  strength: number;
}) {
  const group = useRef<THREE.Group>(null);
  const current = useRef({ x: 0, y: 0 });
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    const targetX = -pointer.x * strength;
    const targetY = -pointer.y * strength;
    current.current.x += (targetX - current.current.x) * 0.05;
    current.current.y += (targetY - current.current.y) * 0.05;
    group.current.position.x = current.current.x;
    group.current.position.y = current.current.y;
  });

  return <group ref={group}>{children}</group>;
}

function SceneContent({ config }: { config: Web3SciFiBackgroundConfig }) {
  return (
    <>
      <GradientPlane />
      {config.enableNoise && <NoisePlane speed={config.noiseSpeed} opacity={config.opacity} />}
      {config.enableParticles && (
        <ParticleField
          count={config.particleCount}
          opacity={config.opacity}
          enableBloom={config.enableBloom}
        />
      )}
    </>
  );
}

/** R3F 场景内容：渐变底 + 可选噪声 + 粒子 + 视差包装（与 `Web3SciFiBackground` Canvas 同源）。 */
export function SceneWithParallax({ config }: { config: Web3SciFiBackgroundConfig }) {
  const content = <SceneContent config={config} />;
  if (config.parallaxStrength <= 0) {
    return content;
  }
  return <ParallaxGroup strength={config.parallaxStrength}>{content}</ParallaxGroup>;
}
