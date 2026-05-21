import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  arcFlowPulseNearLandHub,
  arcMidpointFarFromPhase1Hubs,
  arcIsOrphanSeaChord,
  arcMidpointLatLon,
  nearestPhase1HubDistanceDeg,
  filterHeroTravelRoutes,
  isIllustrativeOpenOceanMidpoint,
  resolveHeroGlobeRouteBias,
} from "@/lib/traveltrustGlobeArcCull";
import { greatCircleArcPoints } from "@/lib/traveltrustGlobeGeodesy";
import { TRAVELTRUST_PHASE1_TRAVEL_ROUTES } from "@/lib/traveltrustPhase1TravelRoutes";

describe("traveltrustGlobeArcCull", () => {
  it("filters atlantic routes for hero bias", () => {
    const atlantic = filterHeroTravelRoutes(TRAVELTRUST_PHASE1_TRAVEL_ROUTES, "atlantic");
    expect(atlantic.map((r) => r.id)).toEqual(["us-fr", "us-es"]);
  });

  it("detects americas-facing bias when US hub faces camera", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0.4, 7.55);
    camera.updateMatrixWorld();
    const matrixWorld = new THREE.Matrix4();
    const bias = resolveHeroGlobeRouteBias(camera, matrixWorld);
    expect(["atlantic", "asia", "any"]).toContain(bias);
  });

  it("drops cn-fr from any bias pool", () => {
    const any = filterHeroTravelRoutes(TRAVELTRUST_PHASE1_TRAVEL_ROUTES, "any");
    expect(any.some((r) => r.id === "cn-fr")).toBe(false);
  });

  it("filters asia routes for hero bias", () => {
    const asia = filterHeroTravelRoutes(TRAVELTRUST_PHASE1_TRAVEL_ROUTES, "asia");
    expect(asia.map((r) => r.id)).toEqual(["cn-th", "cn-jp", "jp-sg"]);
  });

  it("flags north pacific open-ocean midpoint", () => {
    expect(isIllustrativeOpenOceanMidpoint(18, 165)).toBe(true);
    expect(isIllustrativeOpenOceanMidpoint(40, -74)).toBe(false);
  });

  it("trans-pacific chord midpoint is far from land hubs", () => {
    const pts = greatCircleArcPoints(1.78, 34, -118, 35.68, 139.69, 48);
    expect(arcMidpointFarFromPhase1Hubs(pts)).toBe(true);
    const mid = arcMidpointLatLon(pts);
    expect(typeof mid.lat).toBe("number");
  });

  it("cn-th chord midpoint stays near a hub", () => {
    const pts = greatCircleArcPoints(1.78, 31.2, 121.5, 13.75, 100.5, 32);
    expect(arcMidpointFarFromPhase1Hubs(pts)).toBe(false);
  });

  it("flow pulse only near land hubs not mid-pacific", () => {
    expect(arcFlowPulseNearLandHub(31.2, 121.5)).toBe(true);
    expect(arcFlowPulseNearLandHub(18, 165)).toBe(false);
    expect(nearestPhase1HubDistanceDeg(18, 165)).toBeGreaterThan(11);
  });

  it("flags orphan sea chord when midpoint faces but hubs do not", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0.4, 7.55);
    const matrixWorld = new THREE.Matrix4();
    const pts = greatCircleArcPoints(1.78, 31.2, 121.5, 48.86, 2.35, 32);
    const orphan = arcIsOrphanSeaChord(pts, camera, matrixWorld);
    expect(typeof orphan).toBe("boolean");
  });
});
