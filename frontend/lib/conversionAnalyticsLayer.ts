/**
 * Product Enhancement Sprint · Wave 3 · Conversion Analytics Layer
 * 客户端统一埋点 · localStorage 环形缓冲 — 不改订单/Escrow/治理 API
 */
import type { ConversionFunnelStageId, RoleEntryId } from "./conversionFunnelModel";
import { CONVERSION_FUNNEL_STAGES, TOUCHPOINT_FUNNEL_STAGE } from "./conversionFunnelModel";
import { PES_WAVE3_ID, type PesAbTestDefinition, PES_AB_TEST_REGISTRY } from "./conversionAnalyticsAbRegistry";
import type { PesTouchpoint } from "./productEnhancementSprint";

export { PES_WAVE3_ID };

export const PES_ANALYTICS_STORAGE_KEY = "tt_pes_conversion_analytics_v1" as const;
export const PES_ANALYTICS_SESSION_KEY = "tt_pes_analytics_session_v1" as const;
export const PES_ANALYTICS_AB_ASSIGN_KEY = "tt_pes_ab_assignments_v1" as const;
export const PES_ANALYTICS_MAX_EVENTS = 2500;

export type PesAnalyticsCategory =
  | "touchpoint_view"
  | "funnel_stage_click"
  | "funnel_next_cta"
  | "cta_click"
  | "role_entry_click"
  | "registration_intent"
  | "identity_intent"
  | "guide_recruit_click"
  | "governance_participation"
  | "escrow_trust_click"
  | "ab_exposure"
  | "ab_conversion";

export type PesAnalyticsEvent = {
  id: string;
  ts: number;
  wave3Id: typeof PES_WAVE3_ID;
  sessionId: string;
  touchpoint: PesTouchpoint;
  category: PesAnalyticsCategory;
  stageId?: ConversionFunnelStageId;
  roleId?: RoleEntryId;
  ctaId?: string;
  href?: string;
  abTestId?: string;
  abVariant?: string;
};

export type FunnelStageMetric = {
  stageId: ConversionFunnelStageId;
  labelKey: string;
  sessions: number;
  events: number;
};

export type DropoffRow = {
  fromStageId: ConversionFunnelStageId;
  toStageId: ConversionFunnelStageId;
  fromSessions: number;
  toSessions: number;
  dropoffRate: number;
  retentionRate: number;
};

export type TouchpointCountRow = {
  touchpoint: PesTouchpoint;
  count: number;
};

export type AbTestMetricRow = {
  testId: string;
  variant: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
};

export type ConversionAnalyticsSnapshot = {
  wave3Id: typeof PES_WAVE3_ID;
  generatedAt: number;
  totalEvents: number;
  uniqueSessions: number;
  funnelStages: FunnelStageMetric[];
  dropoffMatrix: DropoffRow[];
  touchpointViews: TouchpointCountRow[];
  ctaClicks: TouchpointCountRow[];
  roleEntryClicks: { roleId: RoleEntryId; count: number }[];
  registrationIntents: number;
  identityIntents: number;
  guideRecruitClicks: number;
  governanceParticipation: number;
  escrowTrustClicks: number;
  abTests: AbTestMetricRow[];
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pes-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreatePesSessionId(): string {
  if (!isBrowser()) return "ssr";
  try {
    let sid = sessionStorage.getItem(PES_ANALYTICS_SESSION_KEY);
    if (!sid) {
      sid = newEventId();
      sessionStorage.setItem(PES_ANALYTICS_SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "unknown";
  }
}

function readEventsRaw(): PesAnalyticsEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(PES_ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PesAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(events: PesAnalyticsEvent[]): void {
  if (!isBrowser()) return;
  try {
    const trimmed = events.slice(-PES_ANALYTICS_MAX_EVENTS);
    localStorage.setItem(PES_ANALYTICS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota or private mode */
  }
}

export function getPesAnalyticsEvents(): readonly PesAnalyticsEvent[] {
  return readEventsRaw();
}

export function clearPesAnalyticsEvents(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(PES_ANALYTICS_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function inferIntentCategory(href: string): PesAnalyticsCategory | null {
  const path = href.split("?")[0] ?? href;
  if (path === "/auth/register" || path.startsWith("/auth/register/")) return "registration_intent";
  if (path === "/me/identities" || path.startsWith("/me/identities/")) return "identity_intent";
  if (path === "/guide/register" || path.startsWith("/guide/register/")) return "guide_recruit_click";
  if (path.startsWith("/governance")) return "governance_participation";
  if (path === "/trust" || path.startsWith("/trust/")) return "escrow_trust_click";
  return null;
}

function roleIdToIntent(roleId: RoleEntryId): PesAnalyticsCategory | null {
  switch (roleId) {
    case "traveler":
      return "registration_intent";
    case "guide":
      return "guide_recruit_click";
    case "merchant":
      return "identity_intent";
    case "govern":
      return "governance_participation";
    default:
      return null;
  }
}

export type TrackPesEventInput = Omit<PesAnalyticsEvent, "id" | "ts" | "wave3Id" | "sessionId"> & {
  sessionId?: string;
};

export function trackPesEvent(input: TrackPesEventInput): void {
  if (!isBrowser()) return;
  const event: PesAnalyticsEvent = {
    id: newEventId(),
    ts: Date.now(),
    wave3Id: PES_WAVE3_ID,
    sessionId: input.sessionId ?? getOrCreatePesSessionId(),
    touchpoint: input.touchpoint,
    category: input.category,
    ...(input.stageId ? { stageId: input.stageId } : {}),
    ...(input.roleId ? { roleId: input.roleId } : {}),
    ...(input.ctaId ? { ctaId: input.ctaId } : {}),
    ...(input.href ? { href: input.href } : {}),
    ...(input.abTestId ? { abTestId: input.abTestId } : {}),
    ...(input.abVariant ? { abVariant: input.abVariant } : {}),
  };
  const events = readEventsRaw();
  events.push(event);
  writeEvents(events);

  if (input.href) {
    const intent = inferIntentCategory(input.href);
    if (intent && intent !== input.category) {
      trackPesEvent({
        touchpoint: input.touchpoint,
        category: intent,
        href: input.href,
        ...(input.stageId ? { stageId: input.stageId } : {}),
        ...(input.ctaId ? { ctaId: input.ctaId } : {}),
      });
    }
  }
}

export function trackPesTouchpointView(touchpoint: PesTouchpoint): void {
  trackPesEvent({
    touchpoint,
    category: "touchpoint_view",
    stageId: TOUCHPOINT_FUNNEL_STAGE[touchpoint],
  });
}

export function trackPesFunnelStageClick(
  touchpoint: PesTouchpoint,
  stageId: ConversionFunnelStageId,
  href: string,
): void {
  trackPesEvent({ touchpoint, category: "funnel_stage_click", stageId, href });
}

export function trackPesFunnelNextCta(
  touchpoint: PesTouchpoint,
  stageId: ConversionFunnelStageId,
  href: string,
  ctaId: string,
): void {
  trackPesEvent({ touchpoint, category: "funnel_next_cta", stageId, href, ctaId });
}

export function trackPesCtaClick(touchpoint: PesTouchpoint, href: string, ctaId: string): void {
  trackPesEvent({ touchpoint, category: "cta_click", href, ctaId });
}

export function trackPesRoleEntryClick(touchpoint: PesTouchpoint, roleId: RoleEntryId, href: string): void {
  trackPesEvent({ touchpoint, category: "role_entry_click", roleId, href });
  const intent = roleIdToIntent(roleId);
  if (intent) {
    trackPesEvent({ touchpoint, category: intent, roleId, href, ctaId: `role_${roleId}` });
  }
}

export function trackPesEscrowTrustClick(touchpoint: PesTouchpoint, href: string, variant: string): void {
  trackPesEvent({
    touchpoint,
    category: "escrow_trust_click",
    href,
    ctaId: `escrow_trust_${variant}`,
  });
}

function hashAssign(sessionId: string, testId: string, variantCount: number): number {
  let h = 0;
  const s = `${sessionId}:${testId}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % variantCount;
}

function readAbAssignments(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(PES_ANALYTICS_AB_ASSIGN_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeAbAssignments(assignments: Record<string, string>): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PES_ANALYTICS_AB_ASSIGN_KEY, JSON.stringify(assignments));
  } catch {
    /* noop */
  }
}

export function getPesAbVariant(test: PesAbTestDefinition): string {
  const assignments = readAbAssignments();
  const existing = assignments[test.id];
  if (existing && test.variants.includes(existing)) return existing;
  const variant = test.variants[hashAssign(getOrCreatePesSessionId(), test.id, test.variants.length)]!;
  assignments[test.id] = variant;
  writeAbAssignments(assignments);
  return variant;
}

export function trackPesAbExposure(touchpoint: PesTouchpoint, testId: string, variant: string): void {
  trackPesEvent({
    touchpoint,
    category: "ab_exposure",
    abTestId: testId,
    abVariant: variant,
    ctaId: `ab_exposure_${testId}`,
  });
}

export function trackPesAbConversion(touchpoint: PesTouchpoint, testId: string, variant: string): void {
  trackPesEvent({
    touchpoint,
    category: "ab_conversion",
    abTestId: testId,
    abVariant: variant,
    ctaId: `ab_conversion_${testId}`,
  });
}

function sessionsByStage(events: readonly PesAnalyticsEvent[]): Map<ConversionFunnelStageId, Set<string>> {
  const map = new Map<ConversionFunnelStageId, Set<string>>();
  for (const stage of CONVERSION_FUNNEL_STAGES) {
    map.set(stage.id, new Set());
  }
  for (const e of events) {
    if (e.stageId && map.has(e.stageId)) {
      map.get(e.stageId)!.add(e.sessionId);
    }
    if (e.category === "touchpoint_view") {
      const defaultStage = TOUCHPOINT_FUNNEL_STAGE[e.touchpoint];
      map.get(defaultStage)?.add(e.sessionId);
    }
  }
  return map;
}

function countByCategory(events: readonly PesAnalyticsEvent[], category: PesAnalyticsCategory): number {
  return events.filter((e) => e.category === category).length;
}

function countByTouchpoint(events: readonly PesAnalyticsEvent[], category: PesAnalyticsCategory): TouchpointCountRow[] {
  const counts = new Map<PesTouchpoint, number>();
  for (const e of events) {
    if (e.category !== category) continue;
    counts.set(e.touchpoint, (counts.get(e.touchpoint) ?? 0) + 1);
  }
  return [...counts.entries()].map(([touchpoint, count]) => ({ touchpoint, count }));
}

export function buildConversionAnalyticsSnapshot(
  events: readonly PesAnalyticsEvent[] = getPesAnalyticsEvents(),
): ConversionAnalyticsSnapshot {
  const sessionSets = sessionsByStage(events);
  const funnelStages: FunnelStageMetric[] = CONVERSION_FUNNEL_STAGES.map((s) => ({
    stageId: s.id,
    labelKey: s.labelKey,
    sessions: sessionSets.get(s.id)?.size ?? 0,
    events: events.filter((e) => e.stageId === s.id).length,
  }));

  const dropoffMatrix: DropoffRow[] = [];
  for (let i = 0; i < CONVERSION_FUNNEL_STAGES.length - 1; i++) {
    const from = CONVERSION_FUNNEL_STAGES[i]!;
    const to = CONVERSION_FUNNEL_STAGES[i + 1]!;
    const fromSessions = sessionSets.get(from.id)?.size ?? 0;
    const toSessions = sessionSets.get(to.id)?.size ?? 0;
    const retentionRate = fromSessions > 0 ? toSessions / fromSessions : 0;
    dropoffMatrix.push({
      fromStageId: from.id,
      toStageId: to.id,
      fromSessions,
      toSessions,
      dropoffRate: fromSessions > 0 ? 1 - retentionRate : 0,
      retentionRate,
    });
  }

  const roleCounts = new Map<RoleEntryId, number>();
  for (const e of events) {
    if (e.category === "role_entry_click" && e.roleId) {
      roleCounts.set(e.roleId, (roleCounts.get(e.roleId) ?? 0) + 1);
    }
  }

  const abTests: AbTestMetricRow[] = [];
  for (const test of PES_AB_TEST_REGISTRY) {
    for (const variant of test.variants) {
      const exposures = events.filter(
        (e) => e.abTestId === test.id && e.abVariant === variant && e.category === "ab_exposure",
      ).length;
      const conversions = events.filter(
        (e) => e.abTestId === test.id && e.abVariant === variant && e.category === "ab_conversion",
      ).length;
      abTests.push({
        testId: test.id,
        variant,
        exposures,
        conversions,
        conversionRate: exposures > 0 ? conversions / exposures : 0,
      });
    }
  }

  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;

  return {
    wave3Id: PES_WAVE3_ID,
    generatedAt: Date.now(),
    totalEvents: events.length,
    uniqueSessions,
    funnelStages,
    dropoffMatrix,
    touchpointViews: countByTouchpoint(events, "touchpoint_view"),
    ctaClicks: countByTouchpoint(events, "cta_click"),
    roleEntryClicks: [...roleCounts.entries()].map(([roleId, count]) => ({ roleId, count })),
    registrationIntents: countByCategory(events, "registration_intent"),
    identityIntents: countByCategory(events, "identity_intent"),
    guideRecruitClicks: countByCategory(events, "guide_recruit_click"),
    governanceParticipation: countByCategory(events, "governance_participation"),
    escrowTrustClicks: countByCategory(events, "escrow_trust_click"),
    abTests,
  };
}

export function exportPesAnalyticsJson(): string {
  return JSON.stringify(
    {
      snapshot: buildConversionAnalyticsSnapshot(),
      events: getPesAnalyticsEvents(),
      abRegistry: PES_AB_TEST_REGISTRY,
    },
    null,
    2,
  );
}
