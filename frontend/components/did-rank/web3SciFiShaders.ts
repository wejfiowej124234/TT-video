/**
 * GLSL for `Web3SciFiBackground` noise plane only.
 * Sidecar so `web3SciFiBackgroundScene.tsx` / `Web3SciFiBackground.tsx` stay smaller (46 / 43-46 optional split).
 */

export const WEB3_SCIFI_NOISE_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const WEB3_SCIFI_NOISE_FRAG = `
uniform float uTime;
uniform float uSpeed;
uniform float uOpacity;
varying vec2 vUv;

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

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
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
