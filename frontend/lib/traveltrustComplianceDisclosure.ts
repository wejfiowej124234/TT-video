/**
 * v6 合规披露文案机读锚点（TT-PH1-168/179 · ①）
 * 非 legal 签核；仅保证主视野 locale 含约定语义片段。
 */

export const TRAVELTRUST_V6_COMPLIANCE_DISCLOSURE_KEYS = [
  "traveltrust_trust_chips_disclaimer",
  "traveltrust_hero_trust_chips_disclaimer",
  "traveltrust_hero_p3_lead",
  "traveltrust_footer_compliance",
  "traveltrust_footer_t2",
  "traveltrust_start_disclaimer",
  "traveltrust_liquidity_disclaimer",
  "traveltrust_settlement_disclaimer",
  "traveltrust_faq_a5",
] as const;

/** zh：禁止融资/证券承诺式措辞须带否定或「示意」 */
export const TRAVELTRUST_V6_COMPLIANCE_MARKERS_ZH: Record<
  (typeof TRAVELTRUST_V6_COMPLIANCE_DISCLOSURE_KEYS)[number],
  readonly string[]
> = {
  traveltrust_trust_chips_disclaimer: ["证券", "治理"],
  traveltrust_hero_trust_chips_disclaimer: ["示意", "托管"],
  traveltrust_hero_p3_lead: ["示意", "托管"],
  traveltrust_footer_compliance: ["示意", "证券", "治理"],
  traveltrust_footer_t2: ["证券", "托管"],
  traveltrust_start_disclaimer: ["托管", "治理"],
  traveltrust_liquidity_disclaimer: ["预览", "证券"],
  traveltrust_settlement_disclaimer: ["证券", "治理"],
  traveltrust_faq_a5: ["证券", "代币"],
};

export const TRAVELTRUST_V6_COMPLIANCE_MARKERS_EN: Record<
  (typeof TRAVELTRUST_V6_COMPLIANCE_DISCLOSURE_KEYS)[number],
  readonly string[]
> = {
  traveltrust_trust_chips_disclaimer: ["securities", "governance"],
  traveltrust_hero_trust_chips_disclaimer: ["illustrative", "escrow"],
  traveltrust_hero_p3_lead: ["illustrative", "escrow"],
  traveltrust_footer_compliance: ["illustrative", "securities", "governance"],
  traveltrust_footer_t2: ["securities", "escrow"],
  traveltrust_start_disclaimer: ["escrow", "governance"],
  traveltrust_liquidity_disclaimer: ["preview", "securities"],
  traveltrust_settlement_disclaimer: ["governance", "securities"],
  traveltrust_faq_a5: ["securities", "token"],
};

export function assertComplianceMarkers(
  locale: Record<string, string>,
  markers: Record<string, readonly string[]>,
): string[] {
  const violations: string[] = [];
  for (const key of TRAVELTRUST_V6_COMPLIANCE_DISCLOSURE_KEYS) {
    const value = locale[key] ?? "";
    for (const marker of markers[key] ?? []) {
      if (!value.toLowerCase().includes(marker.toLowerCase())) {
        violations.push(`${key} missing "${marker}"`);
      }
    }
  }
  return violations;
}
