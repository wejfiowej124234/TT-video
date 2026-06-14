import { describe, expect, it, beforeEach } from "vitest";
import { CONVERSION_FUNNEL_STAGES } from "./conversionFunnelModel";
import { PES_AB_TEST_REGISTRY } from "./conversionAnalyticsAbRegistry";
import {
  PES_ANALYTICS_SESSION_KEY,
  PES_ANALYTICS_STORAGE_KEY,
  PES_WAVE3_ID,
  buildConversionAnalyticsSnapshot,
  clearPesAnalyticsEvents,
  getOrCreatePesSessionId,
  getPesAbVariant,
  trackPesCtaClick,
  trackPesEvent,
  trackPesRoleEntryClick,
  trackPesTouchpointView,
} from "./conversionAnalyticsLayer";

describe("conversionAnalyticsLayer", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("exposes stable wave3 id", () => {
    expect(PES_WAVE3_ID).toBe("product-enhancement-wave3-analytics-20260607");
  });

  it("persists touchpoint views and builds funnel snapshot", () => {
    const sid = getOrCreatePesSessionId();
    expect(sid).toBeTruthy();
    trackPesTouchpointView("home");
    trackPesTouchpointView("market");
    trackPesCtaClick("home", "/auth/register", "home_strip_cta");
    const snap = buildConversionAnalyticsSnapshot();
    expect(snap.totalEvents).toBeGreaterThanOrEqual(3);
    expect(snap.registrationIntents).toBeGreaterThanOrEqual(1);
    expect(snap.funnelStages).toHaveLength(CONVERSION_FUNNEL_STAGES.length);
    expect(snap.dropoffMatrix).toHaveLength(CONVERSION_FUNNEL_STAGES.length - 1);
  });

  it("tracks role entry intents", () => {
    trackPesRoleEntryClick("home", "guide", "/guide/register");
    const snap = buildConversionAnalyticsSnapshot();
    expect(snap.guideRecruitClicks).toBeGreaterThanOrEqual(1);
    expect(snap.roleEntryClicks.some((r) => r.roleId === "guide")).toBe(true);
  });

  it("assigns stable AB variants per session", () => {
    const test = PES_AB_TEST_REGISTRY[0]!;
    const a = getPesAbVariant(test);
    const b = getPesAbVariant(test);
    expect(a).toBe(b);
    expect(test.variants).toContain(a);
  });

  it("stores events in localStorage under ssot key", () => {
    trackPesEvent({ touchpoint: "governance", category: "governance_participation", href: "/governance" });
    expect(localStorage.getItem(PES_ANALYTICS_STORAGE_KEY)).toContain("governance_participation");
    clearPesAnalyticsEvents();
    expect(localStorage.getItem(PES_ANALYTICS_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(PES_ANALYTICS_SESSION_KEY)).toBeTruthy();
  });
});
