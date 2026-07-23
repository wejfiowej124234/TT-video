-- HU-004 · Align public announcements to Final Truth Baseline (cite-only · ≠ Production GO)
-- Archives stale Phase1/2/3 Sepolia narrative + expired 2026-07-15 launch copy.
-- Adds Final Truth status strip (Candidate v2 · tip ea71c577 · Hard Gate open).

UPDATE cms_public_announcements
SET publish_status = 'archived', version = version + 1, updated_at = now()
WHERE slug IN (
    'product-deploy-phase1',
    'product-deploy-phase2',
    'product-deploy-phase3',
    'product-planned-launch',
    'phase3-entry-mainnet-prep'
) AND publish_status = 'published';

INSERT INTO cms_public_announcements (
    slug, lane, kind, content_tier, publish_status, pinned, sort_order,
    title_zh, title_en, summary_zh, summary_en, body_zh, body_en,
    effective_at, release_at, cta_kind, cta_href, network_scope, message_key, published_at
) VALUES
(
    'final-truth-baseline-status',
    'protocol_status',
    'product',
    'live',
    'published',
    true,
    200,
    'Final Truth Baseline · 状态条',
    'Final Truth Baseline · status',
    '唯一真源：Candidate v2 · Pin PSG-REL-20260720-WEB3-CAND-V2 · tip ea71c577。Hard Gate / Production GO / Cutover 仍为 fail-closed — 本条≠放行。',
    'Sole truth: Candidate v2 · Pin PSG-REL-20260720-WEB3-CAND-V2 · tip ea71c577. Hard Gate / Production GO / Cutover remain fail-closed — this is not a GO.',
    '公开状态对齐 Engineering SSOT Anchor 与 FINAL RELEASE Baseline（cite-only）。禁止将本公告理解为 Production GO 或 Cutover PASS。历史 Phase1/2/3 Sepolia 叙事已归档为旁证。',
    'Public status aligns to Engineering SSOT Anchor and FINAL RELEASE Baseline (cite-only). Do not read this as Production GO or Cutover PASS. Legacy Phase1/2/3 Sepolia copy is archived as historical context.',
    NULL,
    NULL,
    'learn_more',
    '/traveltrust/announcements',
    'all',
    'traveltrust_pulse_final_truth_baseline',
    now()
),
(
    'final-truth-hard-gate-open',
    'protocol_status',
    'product',
    'upcoming',
    'published',
    false,
    190,
    'Mainnet Hard Gate · 仍开放',
    'Mainnet Hard Gate · still open',
    '主网 Hard Gate 检查项仍有开放项（含 09/12/14 类）。未清闸前禁止宣称 Cutover / Production GO。',
    'Mainnet Hard Gate still has open checks (incl. 09/12/14-class). Do not claim Cutover / Production GO while open.',
    '详见 Owner Hard Gate 清单与 Axis 证据。本条仅为诚实状态披露，非投资要约。',
    'See Owner Hard Gate checklist and Axis evidence. Status disclosure only — not an investment offer.',
    NULL,
    NULL,
    'learn_more',
    '/traveltrust/announcements',
    'all',
    'traveltrust_pulse_hard_gate_open',
    now()
)
ON CONFLICT (slug) DO UPDATE SET
    lane = EXCLUDED.lane,
    kind = EXCLUDED.kind,
    content_tier = EXCLUDED.content_tier,
    publish_status = EXCLUDED.publish_status,
    pinned = EXCLUDED.pinned,
    sort_order = EXCLUDED.sort_order,
    title_zh = EXCLUDED.title_zh,
    title_en = EXCLUDED.title_en,
    summary_zh = EXCLUDED.summary_zh,
    summary_en = EXCLUDED.summary_en,
    body_zh = EXCLUDED.body_zh,
    body_en = EXCLUDED.body_en,
    cta_kind = EXCLUDED.cta_kind,
    cta_href = EXCLUDED.cta_href,
    network_scope = EXCLUDED.network_scope,
    message_key = EXCLUDED.message_key,
    published_at = COALESCE(cms_public_announcements.published_at, now()),
    version = cms_public_announcements.version + 1,
    updated_at = now();
