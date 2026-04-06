"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  DEFAULT_WEB3_SCIFI_BACKGROUND_CONFIG,
  MOBILE_WEB3_SCIFI_BACKGROUND_CONFIG,
  SCIFI_BG_HEX,
  SCIFI_GLOW_HEX,
  type Web3SciFiBackgroundConfig,
} from "./web3SciFiBackgroundConfig";

const NOISE_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const NOISE_FRAG = `
uniform float uTime;
uniform float uSpeed;
uniform float uOpacity;
varying vec2 vUv;

// 简单 3D 值噪声
float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
  return n;
}

// FBM 流体感
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  float f = 1.0;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
    f *= 2.0;
  }
  return v;
}

void main() {
  vec3 q = vec3(vUv * 2.5, uTime * uSpeed * 0.15);
  float n = fbm(q);
  float n2 = fbm(q + vec3(1.2, 0.8, 0.3));
  float v = (n + n2) * 0.5;
  v = smoothstep(0.2, 0.7, v);
  vec3 col = mix(
    vec3(0.02, 0.05, 0.12),
    vec3(0.08, 0.25, 0.45),
    v * uOpacity
  );
  gl_FragColor = vec4(col, 0.45 * uOpacity * (0.3 + v));
}
`;

function GradientPlane() {
  return (
    <mesh position={[0, 0, -0.5]} scale={[24, 24, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={new THREE.Color(SCIFI_BG_HEX)}
        depthWrite={true}
      />
    </mesh>
  );
}

function NoisePlane({ speed, opacity }: { speed: number; opacity: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: NOISE_VERT,
      fragmentShader: NOISE_FRAG,
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
      {config.enableNoise && (
        <NoisePlane speed={config.noiseSpeed} opacity={config.opacity} />
      )}
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

function SceneWithParallax({
  config,
}: {
  config: Web3SciFiBackgroundConfig;
}) {
  const content = <SceneContent config={config} />;
  if (config.parallaxStrength <= 0) {
    return content;
  }
  return (
    <ParallaxGroup strength={config.parallaxStrength}>
      {content}
    </ParallaxGroup>
  );
}

export interface Web3SciFiBackgroundProps {
  /** 覆盖默认配置（部分或全部） */
  config?: Partial<Web3SciFiBackgroundConfig>;
  /** 强制使用移动端预设（少粒子、关 Bloom）；不传则根据窗口与 matchMedia 推断 */
  isMobile?: boolean;
  /** 容器类名 */
  className?: string;
}

export function Web3SciFiBackground({
  config: configOverride,
  isMobile: isMobileProp,
  className = "",
}: Web3SciFiBackgroundProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const check = () => setIsMobile(mql.matches);
    check();
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, []);

  const effectiveMobile = isMobileProp ?? isMobile;
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) setUseFallback(true);
    } catch {
      setUseFallback(true);
    }
  }, []);

  const fullConfig: Web3SciFiBackgroundConfig = useMemo(
    () => ({
      ...DEFAULT_WEB3_SCIFI_BACKGROUND_CONFIG,
      ...(effectiveMobile ? MOBILE_WEB3_SCIFI_BACKGROUND_CONFIG : {}),
      ...configOverride,
    }),
    [effectiveMobile, configOverride]
  );

  const containerStyle = {
    position: "absolute" as const,
    inset: 0,
    zIndex: 0,
    overflow: "hidden",
  };

  if (useFallback) {
    return (
      <div
        className={`${className} bg-scifi-canvas`}
        style={containerStyle}
        aria-hidden
      />
    );
  }

  return (
    <div className={className} style={containerStyle} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={effectiveMobile && typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : undefined}
        frameloop="always"
      >
        <color attach="background" args={[SCIFI_BG_HEX]} />
        <SceneWithParallax config={fullConfig} />
      </Canvas>
    </div>
  );
}

export default React.memo(Web3SciFiBackground);
