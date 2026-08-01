/**
 * Batch-9 U2 · 入驻队列行首人话（店名/申请人优先 · 邮箱/uid 次级）。
 * Batch-11 W04 HU-362 · 关键字段预览（国别 / 实体 / 辖区）。
 */

export type OnboardingQueueKind = "provider" | "steward" | "guide";

export type OnboardingQueueRowInput = {
  user_id?: string;
  email?: string | null;
  application?: {
    shop_name?: unknown;
    legal_name?: unknown;
    city?: unknown;
    country_code?: unknown;
    entity_type?: unknown;
    jurisdictions?: unknown;
    status?: string;
    submitted_at?: string;
  } | null;
};

function asNonEmptyString(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s;
}

/** 行首主标题：人话优先。 */
export function resolveOnboardingQueuePrimaryLabel(
  kind: OnboardingQueueKind,
  row: OnboardingQueueRowInput,
): string {
  const app = row.application;
  if (kind === "provider") {
    return (
      asNonEmptyString(app?.shop_name) ||
      asNonEmptyString(app?.legal_name) ||
      asNonEmptyString(row.email) ||
      asNonEmptyString(row.user_id) ||
      "—"
    );
  }
  if (kind === "steward") {
    return (
      asNonEmptyString(app?.legal_name) ||
      asNonEmptyString(row.email) ||
      asNonEmptyString(row.user_id) ||
      "—"
    );
  }
  const city = asNonEmptyString(app?.city);
  const country = asNonEmptyString(app?.country_code);
  const place = [city, country].filter(Boolean).join(" · ");
  return place || asNonEmptyString(row.email) || asNonEmptyString(row.user_id) || "—";
}

/** HU-362 · 队列关键字段预览（不含证件缩略 — 详情卡鉴权预览）。 */
export function resolveOnboardingQueueKeyFieldsPreview(
  kind: OnboardingQueueKind,
  row: OnboardingQueueRowInput,
): string[] {
  const app = row.application;
  const out: string[] = [];
  const country = asNonEmptyString(app?.country_code);
  const city = asNonEmptyString(app?.city);
  const entity = asNonEmptyString(app?.entity_type);
  if (kind === "provider") {
    if (country) out.push(country);
    if (city) out.push(city);
    if (entity) out.push(entity);
  } else if (kind === "steward") {
    if (country) out.push(country);
    const juris = app?.jurisdictions;
    if (Array.isArray(juris) && juris.length > 0) {
      const labels = juris
        .map((j) => (typeof j === "string" ? j.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);
      if (labels.length) out.push(labels.join(" · "));
    }
  } else {
    const primary = resolveOnboardingQueuePrimaryLabel(kind, row);
    if (country && !primary.includes(country)) out.push(country);
    if (city && !primary.includes(city)) out.push(city);
  }
  return out;
}

/** HU-363 · 专用申请详情（user_id 为路由 id · API 真源）。 */
export function onboardingApplicationDetailHref(
  kind: OnboardingQueueKind,
  userId: string,
): string {
  const id = encodeURIComponent(userId);
  if (kind === "provider") return `/admin/provider-applications/${id}`;
  if (kind === "steward") return `/admin/steward-applications/${id}`;
  return `/admin/guide-applications/${id}`;
}

export function onboardingQueueTechIds(row: OnboardingQueueRowInput): {
  email: string;
  userId: string;
} {
  return {
    email: asNonEmptyString(row.email),
    userId: asNonEmptyString(row.user_id),
  };
}
