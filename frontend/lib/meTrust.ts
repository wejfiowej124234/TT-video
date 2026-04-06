/**
 * GET /api/v1/me 的 `trust` 块（04 §3.4、90 / 07 §5.0）；旧后端无 `trust` 时从 `user` 推导最小展示。
 */

import type { UserShape } from "@/components/me/constants";

/** `GET /api/v1/me` 响应中的 `user`；缺失或 `anonymous` 时返回 null（未登录/占位）。 */
export function userFromGetMePayload(data: unknown): UserShape | null {
  const u = (data as { user?: UserShape } | null | undefined)?.user;
  if (!u || typeof u.id !== "string") return null;
  if (u.id === "anonymous") return null;
  return u;
}

/** `trust.reputation.as_guide`（向导角色）；与 `GET /me` 04 §3.4 / 90 §6 对齐 */
export type MeReputationAsGuide = {
  reviews_received_count: number;
  sum_review_weights: number;
  weighted_avg_score: number | null;
};

/** 当前用户作为评价发布者的汇总（与 POST …/orders/:id/reviews 的 ReviewWeight 同源） */
export type MeReputationAsReviewer = {
  reviews_written_count: number;
  sum_review_weights: number;
};

/** `trust.reputation`；非向导时 `as_guide` 为 null */
export type MeReputationSummary = {
  rule_version: string;
  as_guide: MeReputationAsGuide | null;
  /** `me_reputation_summary_v2` 起始终存在；旧后端可缺省 */
  as_reviewer?: MeReputationAsReviewer;
  formula?: string;
  note?: string;
};

export type MeTrustSummary = {
  kyc_status: string;
  wallet_linked: boolean;
  guide_registration_status: string | null;
  /** 仅 `guides.status=rejected` 时由后端写入 `trust`（可缺省或空数组） */
  guide_registration_rejection_codes?: string[];
  /** 人读拒绝说明（可缺省） */
  guide_registration_rejection_message?: string;
  /** 90 §3.1：active | pending_review | restricted（后端规则版） */
  identity_status?: string;
  /** 90 §3.4：low | medium | high（未决争议计数规则版） */
  risk_level?: string;
  /** 机器可读依据，如 open_disputes_as_party:0 */
  risk_basis?: string;
  /** 90 §3.4：规则版命中键（审计/Admin） */
  risk_reason_codes?: string[];
  /** 90 §3.4：规则版处置建议（与后端 `recommended_actions` 同源） */
  recommended_actions?: string[];
  /** 向导加权信誉可解释块；旧后端无 `trust.reputation` 时为 undefined */
  reputation?: MeReputationSummary;
};

function parseStringArray(raw: unknown, key: string): string[] | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const v = (raw as Record<string, unknown>)[key];
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const x of v) {
    if (typeof x === "string" && x.trim() !== "") out.push(x.trim());
  }
  return out.length ? out : undefined;
}

function normKyc(user: UserShape | null | undefined): string {
  const raw = user?.kyc_status;
  if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
  return "none";
}

function walletLinkedFromUser(user: UserShape | null | undefined): boolean {
  const w = user?.default_wallet_address;
  return typeof w === "string" && w.trim() !== "";
}

function parseMeReputation(rep: unknown): MeReputationSummary | undefined {
  if (rep == null || typeof rep !== "object") return undefined;
  const r = rep as Record<string, unknown>;
  const rule_version = typeof r.rule_version === "string" && r.rule_version.trim() !== "" ? r.rule_version.trim() : "";
  if (!rule_version) return undefined;

  let as_guide: MeReputationAsGuide | null = null;
  if (r.as_guide === null) {
    as_guide = null;
  } else if (r.as_guide && typeof r.as_guide === "object") {
    const g = r.as_guide as Record<string, unknown>;
    const reviews_received_count =
      typeof g.reviews_received_count === "number" && Number.isFinite(g.reviews_received_count)
        ? g.reviews_received_count
        : 0;
    const sum_review_weights =
      typeof g.sum_review_weights === "number" && Number.isFinite(g.sum_review_weights) ? g.sum_review_weights : 0;
    const raw = g.weighted_avg_score;
    let weighted_avg_score: number | null = null;
    if (raw === null || raw === undefined) weighted_avg_score = null;
    else if (typeof raw === "number" && Number.isFinite(raw)) weighted_avg_score = raw;
    as_guide = { reviews_received_count, sum_review_weights, weighted_avg_score };
  }

  let as_reviewer: MeReputationAsReviewer | undefined;
  if (r.as_reviewer && typeof r.as_reviewer === "object") {
    const a = r.as_reviewer as Record<string, unknown>;
    const reviews_written_count =
      typeof a.reviews_written_count === "number" && Number.isFinite(a.reviews_written_count)
        ? a.reviews_written_count
        : 0;
    const sum_review_weights =
      typeof a.sum_review_weights === "number" && Number.isFinite(a.sum_review_weights) ? a.sum_review_weights : 0;
    as_reviewer = { reviews_written_count, sum_review_weights };
  }

  const formula = typeof r.formula === "string" && r.formula.trim() !== "" ? r.formula.trim() : undefined;
  const note = typeof r.note === "string" && r.note.trim() !== "" ? r.note.trim() : undefined;
  return { rule_version, as_guide, ...(as_reviewer != null ? { as_reviewer } : {}), formula, note };
}

/** 从完整 getMe JSON + user 得到信任摘要（个人中心 / 向导台共用） */
export function parseMeTrustFromMeResponse(data: unknown, user: UserShape | null | undefined): MeTrustSummary {
  const body = data as { trust?: Record<string, unknown> } | null | undefined;
  const tr = body?.trust;
  if (tr && typeof tr === "object") {
    const kyc =
      typeof tr.kyc_status === "string" && tr.kyc_status.trim() !== ""
        ? tr.kyc_status.trim()
        : normKyc(user);
    const wl =
      typeof tr.wallet_linked === "boolean" ? tr.wallet_linked : walletLinkedFromUser(user);
    let gr: string | null = null;
    if (tr.guide_registration_status === null) gr = null;
    else if (typeof tr.guide_registration_status === "string") gr = tr.guide_registration_status;

    let guide_registration_rejection_codes: string[] | undefined;
    const rejArr = tr.guide_registration_rejection_codes;
    if (Array.isArray(rejArr)) {
      const c = rejArr
        .filter((x): x is string => typeof x === "string" && x.trim() !== "")
        .map((x) => x.trim());
      if (c.length > 0) guide_registration_rejection_codes = c;
    }
    const rmsgRaw = tr.guide_registration_rejection_message;
    const guide_registration_rejection_message =
      typeof rmsgRaw === "string" && rmsgRaw.trim() !== "" ? rmsgRaw.trim() : undefined;
    const identity_status =
      typeof tr.identity_status === "string" && tr.identity_status.trim() !== ""
        ? tr.identity_status.trim()
        : undefined;
    const risk_level =
      typeof tr.risk_level === "string" && tr.risk_level.trim() !== "" ? tr.risk_level.trim() : undefined;
    const risk_basis =
      typeof tr.risk_basis === "string" && tr.risk_basis.trim() !== "" ? tr.risk_basis.trim() : undefined;
    const risk_reason_codes = parseStringArray(tr, "risk_reason_codes");
    const recommended_actions = parseStringArray(tr, "recommended_actions");
    const reputation = parseMeReputation(tr.reputation);
    return {
      kyc_status: kyc,
      wallet_linked: wl,
      guide_registration_status: gr,
      ...(guide_registration_rejection_codes != null ? { guide_registration_rejection_codes } : {}),
      ...(guide_registration_rejection_message != null ? { guide_registration_rejection_message } : {}),
      identity_status,
      risk_level,
      risk_basis,
      ...(risk_reason_codes != null ? { risk_reason_codes } : {}),
      ...(recommended_actions != null ? { recommended_actions } : {}),
      ...(reputation != null ? { reputation } : {}),
    };
  }
  return {
    kyc_status: normKyc(user),
    wallet_linked: walletLinkedFromUser(user),
    guide_registration_status: null,
  };
}

export function formatGuideRegistrationStatus(status: string | null, t: (k: string) => string): string {
  if (status == null || status === "") return t("me_trust_guide_none");
  const s = status.toLowerCase();
  if (s === "pending") return t("me_trust_guide_pending");
  if (s === "active") return t("me_trust_guide_active");
  if (s === "pending_review") return t("me_trust_guide_pending_review");
  if (s === "rejected") return t("me_trust_guide_rejected");
  if (s === "suspended") return t("me_trust_guide_suspended");
  return t("me_trust_guide_raw").replace(/\{\{status\}\}/g, status);
}
