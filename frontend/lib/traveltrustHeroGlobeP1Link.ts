"use client";

/**
 * P1 · Hero 地球联动 SSOT（非冻结 · ①）
 * Roster / CTA / 针脚共享 focus；#start 预填 region。不触碰 WebGL 视觉 token。
 */
import { useEffect, useState } from "react";
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";
import { TRAVELTRUST_ROLES, type TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";
import {
  TRAVELTRUST_V6_IN_PAGE_PLAN_HREF,
  resolveTraveltrustRoleEnterHref,
} from "@/lib/traveltrustPlanTripHref";
import {
  isTraveltrustStartL5StepId,
  type TraveltrustStartL5StepId,
} from "@/lib/traveltrustStartStepIds";
import { clearHeroGlobeFocusForProbe } from "@/lib/traveltrustHeroGlobeE2eProbe";
import {
  listHeroGlobeP1PinProbeFractions,
  resolveHeroGlobeP1ProbeResetFraction,
  type HeroGlobeP1PinProbeFraction,
} from "@/lib/traveltrustHeroGlobeP1ProbeTargets";

export const TRAVELTRUST_HERO_GLOBE_P1_LINK_ID = "TT-HERO-GLOBE-P1-LINK-2026-05" as const;

export type HeroGlobeP1Corridor = HeroGlobeRouteBias;

export type HeroGlobeP1LinkState = {
  focusedRegionId: string | null;
  startPrefillRegionId: string | null;
  startPrefillStepId: TraveltrustStartL5StepId | null;
};

let state: HeroGlobeP1LinkState = {
  focusedRegionId: null,
  startPrefillRegionId: null,
  startPrefillStepId: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getHeroGlobeP1LinkState(): HeroGlobeP1LinkState {
  return state;
}

export function getHeroGlobeP1FocusedRegion(): string | null {
  return state.focusedRegionId;
}

export function setHeroGlobeP1FocusedRegion(regionId: string | null): void {
  if (state.focusedRegionId === regionId) return;
  state = { ...state, focusedRegionId: regionId };
  emit();
}

export function setHeroGlobeP1StartPrefill(regionId: string | null): void {
  if (state.startPrefillRegionId === regionId) return;
  state = { ...state, startPrefillRegionId: regionId };
  emit();
}

export function getHeroGlobeP1StartPrefillStep(): TraveltrustStartL5StepId | null {
  return state.startPrefillStepId;
}

export function setHeroGlobeP1StartPrefillStep(stepId: TraveltrustStartL5StepId | null): void {
  if (state.startPrefillStepId === stepId) return;
  state = { ...state, startPrefillStepId: stepId };
  emit();
}

/** P2-C · 与 #start hash / Start 区同步的 region+step（①） */
export function setHeroGlobeP1StartContext(
  regionId: string | null,
  stepId: TraveltrustStartL5StepId | null,
): void {
  const nextRegion = regionId;
  const nextStep = stepId;
  if (state.startPrefillRegionId === nextRegion && state.startPrefillStepId === nextStep) return;
  state = { ...state, startPrefillRegionId: nextRegion, startPrefillStepId: nextStep };
  emit();
}

/** DOM 针脚 / roster / CTA 共用的「当前强调枢纽」 */
export function resolveHeroGlobeActiveRegionId(hoveredRegionId: string | null): string | null {
  return hoveredRegionId ?? state.focusedRegionId;
}

export function resolveHeroGlobeP1DefaultRegion(bias: HeroGlobeRouteBias): string {
  if (bias === "atlantic") return "us";
  if (bias === "asia") return "cn";
  return "cn";
}

export type TraveltrustStartHashParams = {
  region: string | null;
  step: TraveltrustStartL5StepId | null;
};

function parseStartHashQuery(hash: string): URLSearchParams {
  const raw = hash.replace(/^#/, "");
  const anchor = raw.split("?")[0] ?? "";
  if (anchor !== "start") return new URLSearchParams();
  const q = raw.indexOf("?");
  return new URLSearchParams(q >= 0 ? raw.slice(q + 1) : "");
}

/** `#start?region=cn&step=plan`（P2-B · ①） */
export function buildTraveltrustStartHash(params: {
  region?: string | null;
  step?: TraveltrustStartL5StepId | null;
}): string {
  const qs = new URLSearchParams();
  if (params.region && /^[a-z]{2}$/.test(params.region)) qs.set("region", params.region);
  if (params.step && isTraveltrustStartL5StepId(params.step)) qs.set("step", params.step);
  const tail = qs.toString();
  return tail ? `#start?${tail}` : "#start";
}

export function parseStartStepFromHash(hash: string): TraveltrustStartL5StepId | null {
  const step = parseStartHashQuery(hash).get("step");
  return isTraveltrustStartL5StepId(step) ? step : null;
}

export function parseStartHashParams(hash: string): TraveltrustStartHashParams {
  return {
    region: parseStartRegionFromHash(hash),
    step: parseStartStepFromHash(hash),
  };
}

export function buildTraveltrustPlanTripHrefWithRegion(
  baseHref: string,
  regionId: string | null,
  stepId: TraveltrustStartL5StepId | null = regionId ? "plan" : null,
): string {
  const base = baseHref.trim() || TRAVELTRUST_V6_IN_PAGE_PLAN_HREF;
  if (!regionId) return base;
  const hashIdx = base.indexOf("#");
  const path = hashIdx >= 0 ? base.slice(0, hashIdx) : "";
  const startHash = buildTraveltrustStartHash({ region: regionId, step: stepId ?? "plan" });
  return `${path}${startHash}`;
}

/** 与 Hero `<Link href="#start?region=&step=">` 一致：App Router 下 hash 导航（P1+P2-B · ①） */
export function navigateToStartWithRegion(
  regionId: string,
  stepId: TraveltrustStartL5StepId = "plan",
): void {
  setHeroGlobeP1StartContext(regionId, stepId);
  setHeroGlobeP1FocusedRegion(regionId);
  if (typeof window === "undefined") return;
  writeTraveltrustStartHash({ region: regionId, step: stepId });
  requestAnimationFrame(() => {
    document.getElementById("start")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function parseStartRegionFromHash(hash: string): string | null {
  const id = parseStartHashQuery(hash).get("region");
  return id && /^[a-z]{2}$/.test(id) ? id : null;
}

/** P2-C · 剧场进入按钮：页内角色链 #start?region=&step=（①） */
export function buildTraveltrustTheaterRoleEnterHref(
  roleId: TravelTrustRoleId,
  planHref: string,
  regionId: string | null,
  stepId: TraveltrustStartL5StepId,
): string {
  if (roleId === "traveler" || roleId === "guide" || roleId === "merchant") {
    return buildTraveltrustPlanTripHrefWithRegion(planHref, regionId, stepId);
  }
  const role = TRAVELTRUST_ROLES.find((r) => r.id === roleId);
  return resolveTraveltrustRoleEnterHref(role?.href ?? "");
}

export function writeTraveltrustStartHash(params: {
  region?: string | null;
  step?: TraveltrustStartL5StepId | null;
}): void {
  if (typeof window === "undefined") return;
  const hash = buildTraveltrustStartHash(params);
  const next = hash.replace(/^#/, "");
  if (window.location.hash.replace(/^#/, "") === next) return;
  setHeroGlobeP1StartContext(params.region ?? state.startPrefillRegionId, params.step ?? null);
  window.location.hash = next;
}

export function useHeroGlobeP1Link(): HeroGlobeP1LinkState {
  const [, tick] = useState(0);
  useEffect(() => {
    const sub = () => tick((n) => n + 1);
    listeners.add(sub);
    return () => {
      listeners.delete(sub);
    };
  }, []);
  return state;
}

/** ① P1 验收探针：与针脚 `onPinClick` 同函数，仅 `NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE=1` */
export type HeroGlobeP1ProbeBridge = {
  navigateToStartWithRegion: typeof navigateToStartWithRegion;
  writeStartHash: typeof writeTraveltrustStartHash;
  setFocusedRegion: typeof setHeroGlobeP1FocusedRegion;
  clearFocus: typeof clearHeroGlobeFocusForProbe;
  listPinProbeFractions: () => HeroGlobeP1PinProbeFraction[];
  resolveResetFraction: typeof resolveHeroGlobeP1ProbeResetFraction;
};

declare global {
  interface Window {
    __ttHeroGlobeP1Probe?: HeroGlobeP1ProbeBridge;
    __ttStartP2Probe?: { selectStartStepByIndex: (index: number) => void };
  }
}

function isHeroGlobeP1ProbeBridgeEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE === "1" ||
    process.env.NODE_ENV === "development"
  );
}

if (typeof window !== "undefined" && isHeroGlobeP1ProbeBridgeEnabled()) {
  window.__ttHeroGlobeP1Probe = {
    navigateToStartWithRegion,
    writeStartHash: writeTraveltrustStartHash,
    setFocusedRegion: setHeroGlobeP1FocusedRegion,
    clearFocus: clearHeroGlobeFocusForProbe,
    listPinProbeFractions: listHeroGlobeP1PinProbeFractions,
    resolveResetFraction: resolveHeroGlobeP1ProbeResetFraction,
  };
}
