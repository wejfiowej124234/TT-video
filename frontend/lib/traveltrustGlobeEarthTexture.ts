/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import * as THREE from "three";
import { TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH } from "@/lib/traveltrustGlobeEarthAsset";

/** Equirectangular UV from lat/lon (degrees). */
function uvFromLatLon(latDeg: number, lonDeg: number): { x: number; y: number } {
  return {
    x: (lonDeg + 180) / 360,
    y: (90 - latDeg) / 180,
  };
}

/**
 * Procedural fallback equirectangular earth (① · no JPEG).
 * Used when JPEG unavailable or low-quality tier skips texture load.
 */
export function createTraveltrustGlobeEarthTextureProcedural(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, "#3a4538");
  ocean.addColorStop(0.5, "#4a5648");
  ocean.addColorStop(1, "#2e3528");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  type Land = { lat: number; lon: number; rx: number; ry: number; fill: string };
  const lands: Land[] = [
    { lat: 38, lon: -98, rx: 0.11, ry: 0.09, fill: "#5cb88a" },
    { lat: 55, lon: -100, rx: 0.09, ry: 0.12, fill: "#4aa67a" },
    { lat: 8, lon: -62, rx: 0.07, ry: 0.11, fill: "#6ec49a" },
    { lat: 48, lon: 8, rx: 0.07, ry: 0.08, fill: "#62b888" },
    { lat: 40, lon: -3, rx: 0.05, ry: 0.06, fill: "#58a87c" },
    { lat: 52, lon: 28, rx: 0.12, ry: 0.07, fill: "#4e9e72" },
    { lat: 35, lon: 105, rx: 0.14, ry: 0.12, fill: "#72d4a8" },
    { lat: 22, lon: 78, rx: 0.08, ry: 0.09, fill: "#5eb888" },
    { lat: 15, lon: 101, rx: 0.045, ry: 0.07, fill: "#68c898" },
    { lat: 36, lon: 138, rx: 0.04, ry: 0.055, fill: "#62b888" },
    { lat: 1, lon: 103, rx: 0.022, ry: 0.028, fill: "#7ad8b0" },
    { lat: -25, lon: 133, rx: 0.12, ry: 0.09, fill: "#58a87c" },
    { lat: 24, lon: 54, rx: 0.05, ry: 0.05, fill: "#6ab890" },
    { lat: -15, lon: -55, rx: 0.07, ry: 0.1, fill: "#4e9e72" },
    { lat: 5, lon: 20, rx: 0.09, ry: 0.1, fill: "#52a67a" },
  ];

  for (const land of lands) {
    const { x, y } = uvFromLatLon(land.lat, land.lon);
    const px = x * w;
    const py = y * h;
    const rx = land.rx * w;
    const ry = land.ry * h;
    const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(rx, ry));
    g.addColorStop(0, "#a8ecd0");
    g.addColorStop(0.22, land.fill);
    g.addColorStop(0.68, land.fill);
    g.addColorStop(1, "rgba(42,68,60,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Slight brightness/contrast lift for Hero scrim (① · decorative readability).
 * Returns a new CanvasTexture; does not dispose the source.
 */
export function enhanceTraveltrustGlobeEarthMap(source: THREE.Texture): THREE.CanvasTexture {
  const image = source.image as HTMLImageElement | undefined;
  const w = image?.width ?? 2048;
  const h = image?.height ?? 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx || !image) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }
  /** 轻暖化：空域 `#0c0a09` 由 layout/Canvas 承担，球面保留海陆色阶（earth-realism pass） */
  ctx.filter = "brightness(1.06) contrast(1.08) saturate(0.82) sepia(0.08) hue-rotate(10deg)";
  ctx.drawImage(image, 0, 0, w, h);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(52,36,22,0.18)";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  const poleGain = 0.86;
  const band = Math.floor(h * 0.08);
  ctx.globalCompositeOperation = "multiply";
  for (let y = 0; y < band; y++) {
    const t = 1 - (y / band) * (1 - poleGain);
    ctx.fillStyle = `rgba(${Math.floor(72 * t)},${Math.floor(58 * t)},${Math.floor(48 * t)},0.22)`;
    ctx.fillRect(0, y, w, 1);
    ctx.fillRect(0, h - 1 - y, w, 1);
  }
  ctx.globalCompositeOperation = "source-over";
  /** 赤道轻压青（勿再抹平蓝海横带） */
  const eqHalf = Math.max(4, Math.floor(h * 0.055));
  const midY = Math.floor(h * 0.5);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(44,36,28,0.22)";
  for (let y = midY - eqHalf; y <= midY + eqHalf; y++) {
    if (y >= 0 && y < h) ctx.fillRect(0, y, w, 1);
  }
  ctx.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Load bundled NASA-style equirect JPEG (A closure primary path). */
export function loadTraveltrustGlobeEarthTexture(): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      (err) => reject(err),
    );
  });
}

/** Decorative city-light specks for night hemisphere (① · illustrative). */
export function createTraveltrustGlobeNightLightsTextureProcedural(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, w, h);

  const hubs: { lat: number; lon: number; r: number; warm: boolean }[] = [
    { lat: 40, lon: -74, r: 0.018, warm: true },
    { lat: 34, lon: -118, r: 0.014, warm: true },
    { lat: 51, lon: -0.1, r: 0.016, warm: true },
    { lat: 48, lon: 2.3, r: 0.014, warm: true },
    { lat: 35, lon: 139, r: 0.016, warm: false },
    { lat: 31, lon: 121, r: 0.02, warm: false },
    { lat: 22, lon: 114, r: 0.015, warm: false },
    { lat: 1.3, lon: 103.8, r: 0.012, warm: false },
    { lat: 19, lon: 72.8, r: 0.018, warm: false },
    { lat: 25, lon: 55, r: 0.01, warm: true },
    { lat: -23, lon: -46, r: 0.014, warm: true },
    { lat: -33, lon: 151, r: 0.012, warm: false },
  ];

  for (const hub of hubs) {
    const { x, y } = uvFromLatLon(hub.lat, hub.lon);
    const px = x * w;
    const py = y * h;
    const rad = hub.r * w;
    const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
    const core = hub.warm ? "rgba(255,210,140,0.95)" : "rgba(180,235,255,0.9)";
    g.addColorStop(0, core);
    g.addColorStop(0.35, hub.warm ? "rgba(255,180,90,0.55)" : "rgba(120,210,255,0.45)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** @deprecated alias */
export const createTraveltrustGlobeEarthTexture = createTraveltrustGlobeEarthTextureProcedural;
