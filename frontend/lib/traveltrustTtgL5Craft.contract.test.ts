import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "./traveltrustHomeLayoutLockL5";
import { TRAVELTRUST_HERO_TRUST_CHIPS } from "./traveltrustHeroTrustChips";
import { TRAVELTRUST_OFFICIAL_TEAM } from "./traveltrustOfficialTeam";

const REPO = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf8");
}

describe("traveltrust TTG L5 craft v16 (local)", () => {
  it("locks v16 economy breathing metadata and Owner screenshot section order", () => {
    expect(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.lockId).toBe(
      "TT-TRAVELTRUST-HOME-LAYOUT-LOCK-2026-08-v16-economy-breathing",
    );
    expect(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.sectionOrder).toEqual([
      "hero",
      "trust",
      "settlement",
      "unlock",
      "liquidity",
      "roles",
    ]);
  });

  it("hero chips keep ids but do not restack 15/35/50 or 25T", () => {
    expect(TRAVELTRUST_HERO_TRUST_CHIPS.map((c) => c.id)).toEqual([
      "escrow",
      "governance",
      "compliance",
    ]);
    for (const chip of TRAVELTRUST_HERO_TRUST_CHIPS) {
      expect(zh[chip.key]).not.toMatch(/15|35|50|25T/);
      expect(en[chip.key]).not.toMatch(/15|35|50|25T/);
    }
    expect(zh.traveltrust_hero_p3_lead).not.toMatch(/15%|35%|50%|25T/);
    expect(en.traveltrust_hero_p3_lead).not.toMatch(/15%|35%|50%|25T/);
  });

  it("hero narrative has identity lead without 1/2/3 travel steps", () => {
    const src = read("components/traveltrust/cinematic/TravelTrustHeroNetworkNarrative.tsx");
    expect(src).toContain("data-tt-traveltrust-hero-p3-lead");
    expect(src).not.toContain("data-tt-traveltrust-hero-p3-escrow-timeline");
    expect(src).not.toContain("data-tt-traveltrust-hero-p3-timeline-step");
  });

  it("liquidity uses a V8 price rail and two left facts", () => {
    const facts = read("modules/traveltrust-home/sections/TravelTrustHomeLiquidityFacts.tsx");
    const section = read("modules/traveltrust-home/sections/TravelTrustHomeLiquiditySection.tsx");
    expect(section).toContain("TravelTrustHomeLiquidityPriceRail");
    expect(facts).toContain('data-tt-traveltrust-liquidity-facts-count="2"');
    expect(facts).toContain('data-tt-traveltrust-liquidity-ttg-paths="3"');
    expect(facts).not.toContain("traveltrust_liquidity_facts_card_team_title");
    expect(facts).not.toContain("traveltrust_liquidity_facts_card_dao_title");
    expect(facts).toContain("ttgPerUsdcFromUnitPrice");
    expect(facts).toContain("resolveTtgPublicSaleFocus");
    expect(facts).not.toContain("PRIMARY_MARKET_LIVE_TTG_PER_USDC");
    expect(zh.traveltrust_liquidity_ttg_paths_lead).toMatch(/TTG/);
    expect(zh.traveltrust_liquidity_ttg_paths_hold_body).toMatch(/治理权|席位|治理/);
    expect(zh.traveltrust_liquidity_ttg_paths_hold_body).toMatch(/55%|结余|治理提案/);
    expect(en.traveltrust_liquidity_ttg_paths_hold_body).toMatch(/governance|seat/i);
    expect(en.traveltrust_liquidity_ttg_paths_hold_body).toMatch(/remainder|treasury/i);
    expect(zh.traveltrust_liquidity_ttg_paths_steward_body).toMatch(/审核|席位|质押/);
    expect(zh.traveltrust_liquidity_ttg_paths_steward_body).toMatch(/45%/);
    expect(en.traveltrust_liquidity_ttg_paths_steward_body).toMatch(/review|seat|stake/i);
    expect(en.traveltrust_liquidity_ttg_paths_steward_body).toMatch(/45%/);
    expect(zh.traveltrust_liquidity_ttg_paths_steward_title).toMatch(/区域主理人/);
    expect(zh.traveltrust_liquidity_ttg_paths_note).toMatch(/治理参数页/);
    expect(zh.traveltrust_liquidity_ttg_paths_note).toMatch(/45%/);
    expect(zh.traveltrust_liquidity_ttg_paths_note).toMatch(/55%/);
    expect(zh.traveltrust_liquidity_ttg_paths_note).not.toMatch(/优先分红|保证收益|刚性分红|保本保息/);
    expect(en.traveltrust_liquidity_ttg_paths_note).toMatch(/45%/);
    expect(en.traveltrust_liquidity_ttg_paths_note).toMatch(/55%/);
    expect(facts).not.toContain('accent: "55%"');
    expect(facts).not.toContain('accent: "45%"');
    expect(zh.traveltrust_liquidity_ttg_paths_lead).not.toMatch(/保证收益|刚性分红|保本保息/);
    expect(zh.traveltrust_liquidity_ttg_paths_note).not.toMatch(/保证收益|刚性分红|保本保息/);
    expect(en.traveltrust_liquidity_ttg_paths_note).toMatch(/not a holder dividend|not a yield/i);
  });

  it("trust uses a 5-arc 50/35/3/5/7 dashboard with 25T center", () => {
    const trust = read("components/traveltrust/cinematic/TravelTrustTrustFactsStrip.tsx");
    const dash = read("components/traveltrust/cinematic/TravelTrustTtgAllocationDashboard.tsx");
    expect(trust).toContain("TravelTrustTtgAllocationDashboard");
    expect(trust).not.toContain("TT_SECTION_CONTENT_L5.cardGridClass");
    expect(dash).toContain("data-tt-traveltrust-ttg-alloc-arc={arc.id}");
    expect(dash).toContain('id: "public"');
    expect(dash).toContain('id: "dao"');
    expect(dash).toContain('id: "team"');
    expect(dash).toContain('id: "marketing"');
    expect(dash).toContain('id: "treasury"');
    expect(dash).toContain("data-tt-traveltrust-ttg-alloc-center");
    expect(dash).toContain('data-tt-traveltrust-ttg-alloc-ring-l5="v3"');
    expect(dash).toContain("data-tt-traveltrust-ttg-alloc-label");
    expect(dash).toContain("legendPctClass");
    expect(dash).toContain("tt-alloc-glow");
    expect(dash).toContain("data-tt-traveltrust-ttg-alloc-sheen");
    expect(dash).toContain("traveltrust_ttg_alloc_burnable_badge");
    expect(dash).toContain("pct: 0.5");
    expect(dash).toContain("pct: 0.35");
    expect(dash).toContain("pct: 0.03");
    expect(dash).toContain("pct: 0.05");
    expect(dash).toContain("pct: 0.07");
    expect(dash).not.toContain("pct: 0.15");
    expect(zh.traveltrust_ttg_alloc_center).toBe("25T");
    expect(en.traveltrust_ttg_alloc_center).toBe("25T");
    expect(zh.traveltrust_trust_fact_protocol_title).toMatch(/公开份额 50%/);
    expect(zh.traveltrust_trust_fact_governance_title).toMatch(/DAO/);
    expect(zh.traveltrust_trust_fact_protocol_summary).toMatch(/未售出/);
    expect(zh.traveltrust_trust_fact_protocol_summary).toMatch(/销毁/);
    expect(zh.traveltrust_trust_fact_protocol_summary).not.toMatch(/保证收益|刚性分红|保本保息|价格保护/);
    expect(zh.traveltrust_trust_fact_governance_summary).not.toMatch(/销毁|未售出/);
    expect(en.traveltrust_trust_fact_protocol_summary).toMatch(/unsold/i);
    expect(en.traveltrust_trust_fact_protocol_summary).toMatch(/burn/i);
    expect(en.traveltrust_trust_fact_governance_summary).not.toMatch(/burn/i);
    expect(zh.traveltrust_ttg_alloc_purpose_burn).toMatch(/未售出/);
    expect(zh.traveltrust_ttg_alloc_purpose_burn).toMatch(/销毁/);
    expect(zh.traveltrust_ttg_alloc_purpose_burn).toMatch(/不是价格保护/);
    expect(en.traveltrust_ttg_alloc_purpose_burn).toMatch(/unsold/i);
    expect(en.traveltrust_ttg_alloc_purpose_burn).toMatch(/burn/i);
    expect(en.traveltrust_ttg_alloc_purpose_burn).toMatch(/not price protection/i);
    expect(zh.traveltrust_liquidity_rail_disclaimer).not.toMatch(/V8|Official www/);
    expect(en.traveltrust_liquidity_rail_disclaimer).not.toMatch(/V8|Official www/);
    expect(zh.traveltrust_unlock_disclaimer).not.toMatch(/V8|Official www|本表为本地示意/);
    expect(zh.traveltrust_trust_facts_disclaimer).not.toMatch(/链接打开帮助|Official www/);
    expect(dash).not.toContain("TravelTrustOfficialTeamDialog");
    expect(dash).not.toContain("data-tt-traveltrust-official-team-open");
    expect(dash).not.toContain("/governance/params");
    expect(dash).not.toContain("next/link");
    expect(dash).not.toContain("data-tt-traveltrust-trust-facts-card-tap");
    expect(read("components/traveltrust/cinematic/TravelTrustFooterCrossNav.tsx")).toContain(
      "TravelTrustOfficialTeamDialog",
    );
    expect(read("components/traveltrust/cinematic/TravelTrustFooterCrossNav.tsx")).toContain(
      "data-tt-traveltrust-official-team-open",
    );
    expect(read("components/traveltrust/cinematic/TravelTrustFooterCrossNav.tsx")).toContain(
      "TRAVELTRUST_PROTOCOL_PAPER_HREF",
    );
    expect(read("components/traveltrust/cinematic/TravelTrustFooterCrossNav.tsx")).not.toContain(
      "/whitepaper",
    );
    expect(zh.traveltrust_trust_fact_escrow_summary).not.toMatch(/官方团队|点此/);
    expect(en.traveltrust_trust_fact_escrow_summary).not.toMatch(/official team/i);
    expect(zh.traveltrust_trust_fact_governance_title).not.toMatch(/空投/);
    expect(en.traveltrust_trust_fact_governance_title).not.toMatch(/airdrop/i);
    expect(zh.traveltrust_ttg_alloc_ring_desc).not.toMatch(/空投/);
    expect(en.traveltrust_ttg_alloc_ring_desc).not.toMatch(/airdrop/i);
    expect(zh.traveltrust_pulse_campaign_referral).not.toMatch(/空投/);
    expect(en.traveltrust_pulse_campaign_referral).not.toMatch(/airdrop/i);
    expect(zh.traveltrust_official_team_title).toBe("官方团队");
    expect(en.traveltrust_official_team_title).toBe("Official team");
    expect(zh.traveltrust_official_team_m1_role).toMatch(/创始人|总工程师/);
    expect(zh.traveltrust_official_team_m2_name).toBe("Yusuf Haddad");
    expect(zh.traveltrust_official_team_m2_role).toMatch(/COO/);
    expect(zh.traveltrust_official_team_m3_role).toMatch(/合规/);
    const teamCopyKeys = [
      "traveltrust_official_team_disclaimer",
      "traveltrust_official_team_m1_bio",
      "traveltrust_official_team_m2_bio",
      "traveltrust_official_team_m3_bio",
      "traveltrust_official_team_m4_bio",
      "traveltrust_official_team_m5_bio",
    ] as const;
    for (const key of teamCopyKeys) {
      expect(zh[key]).not.toMatch(/保证收益|刚性分红|保本保息|认购|空投|招股已获批|监管已批准/);
      expect(en[key]).not.toMatch(/guaranteed return|risk-free|presale|airdrop|prospectus approved/i);
    }
    expect(zh.traveltrust_official_team_disclaimer).toMatch(/不是证券发行材料/);
    expect(en.traveltrust_official_team_disclaimer).toMatch(/not a securities offering/i);
    expect(TRAVELTRUST_OFFICIAL_TEAM).toHaveLength(5);
    expect(TRAVELTRUST_OFFICIAL_TEAM.every((m) => m.image.endsWith(".png"))).toBe(true);
    expect(TRAVELTRUST_OFFICIAL_TEAM.every((m) => m.linkedinUrl == null)).toBe(true);
    for (const member of TRAVELTRUST_OFFICIAL_TEAM) {
      expect(existsSync(join(REPO, "public", member.image.replace(/^\//, "")))).toBe(true);
    }
    expect(read("components/traveltrust/cinematic/TravelTrustOfficialTeamDialog.tsx")).toContain(
      'data-tt-traveltrust-official-team-linkedin="pending"',
    );
  });

  it("unlock schedule uses Owner geometric batches and per-batch sale prices", () => {
    const unlock = read("components/traveltrust/cinematic/TravelTrustTtgUnlockSchedule.tsx");
    const economy = read("modules/traveltrust-home/sections/TravelTrustHomeEconomyClusterSection.tsx");
    expect(economy).toContain("TravelTrustHomeUnlockSection");
    expect(unlock).toContain("TTG_PUBLIC_UNLOCK_BATCHES");
    expect(unlock).toContain("formatUnlockUnitPrice");
    expect(zh.traveltrust_unlock_title).toBe("TTG 公开解锁");
    expect(zh.traveltrust_unlock_tagline).toMatch(/五批|公示解锁|解锁时间表/);
    expect(en.traveltrust_unlock_tagline).toMatch(/five published batches|unlock calendar|unlock schedule/i);
    expect(zh.traveltrust_unlock_tagline).not.toMatch(/二级市场/);
    expect(unlock).toContain("traveltrust_unlock_disclaimer");
    expect(unlock).toContain('data-tt-traveltrust-ttg-unlock-motion-l5="1"');
    expect(unlock).toContain("TT_TTG_UNLOCK_L5.rowHover");
    expect(unlock).toContain("data-tt-traveltrust-ttg-unlock-sheen");
    expect(unlock).toContain("TT_ECONOMY_INTERACT_L5.sheenClass");
    expect(unlock).toContain("useReducedMotion");
    expect(zh.traveltrust_unlock_disclaimer).toMatch(/2026 年 10 月 15 日/);
    expect(zh.traveltrust_unlock_disclaimer).toMatch(/两个月/);
    expect(en.traveltrust_unlock_disclaimer).toMatch(/15 October 2026|October 2026/i);
    expect(en.traveltrust_unlock_disclaimer).toMatch(/two months/i);
    expect(zh.traveltrust_unlock_disclaimer).not.toMatch(/Production GO|Money Path|Official www/);
    expect(en.traveltrust_unlock_disclaimer).not.toMatch(/Production GO|Money Path|Official www/);
    expect(zh.traveltrust_pulse_ttg_v8_25t).not.toMatch(/Production GO|Money Path PARTIAL|已按 .* 部署/);
    expect(en.traveltrust_pulse_ttg_v8_25t).not.toMatch(/Production GO|Money Path PARTIAL/i);
    expect(zh.traveltrust_product_ann_ttg_round_benefit_b1).not.toMatch(/2 万亿/);
    expect(en.traveltrust_product_ann_ttg_round_benefit_b1).not.toMatch(/2 trillion/i);
    expect(zh.traveltrust_hero_wallet_connect_cta).not.toMatch(/swap gateway/i);
    expect(en.traveltrust_hero_wallet_connect_cta).not.toMatch(/swap gateway/i);
    expect(en.traveltrust_official_team_disclaimer).toMatch(/not clickable/i);
    expect(en.traveltrust_official_team_disclaimer).not.toMatch(/linkedin\.com\/in\//i);
  });

  it("settlement keeps announcements CTA and omits duplicate numbered lists", () => {
    const src = read("components/traveltrust/cinematic/TravelTrustSettlementStrip.tsx");
    expect(src).toContain("TRAVELTRUST_ANNOUNCEMENTS_PROTOCOL_SECTION_ID");
    expect(src).toContain("data-tt-traveltrust-settlement-announcements-cta");
    expect(src).toContain("data-tt-traveltrust-settlement-compact-l5");
    expect(src).not.toContain("traveltrust_settlement_notice_1");
    expect(src).not.toContain("data-tt-traveltrust-settlement-timeline");
    expect(src).not.toContain("TT_TRUST_FACTS_L5.cardHoverClass");
    expect(src).not.toContain("TT_SECTION_CONTENT_L5.cardGridClass");
  });

  it("homepage copy keeps governance language and drops sale/yield solicitation", () => {
    const homepageKeys = [
      "traveltrust_hero_cta_ttg",
      "traveltrust_hero_cta_app",
      "traveltrust_app_download_title",
      "traveltrust_scroll_hint",
      "traveltrust_liquidity_ttg_paths_hold_body",
      "traveltrust_liquidity_ttg_paths_steward_body",
      "traveltrust_liquidity_ttg_paths_note",
      "traveltrust_liquidity_ttg_paths_buy_title",
      "traveltrust_unlock_tagline",
      "traveltrust_pulse_ttg_v8_25t",
      "traveltrust_pulse_deploy_phase3_benefit_b3",
      "traveltrust_product_ann_role_steward",
      "traveltrust_hero_earlyAccess",
      "traveltrust_allocation_title",
    ] as const;
    for (const key of homepageKeys) {
      expect(zh[key]).not.toMatch(/种子轮|预售|认购即到账|投资者收益|获取 TTG|认购市场|空投/);
      expect(en[key]).not.toMatch(/seed round|presale|investor yield|Get TTG|airdrop/i);
    }
    expect(zh.traveltrust_hero_cta_ttg).toBe("查看 TTG");
    expect(en.traveltrust_hero_cta_ttg).toBe("View TTG");
    expect(zh.traveltrust_hero_cta_app).toBe("App 预告");
    expect(en.traveltrust_hero_cta_app).toBe("App preview");
    expect(zh.traveltrust_app_download_title).toBe("正在开发中，敬请期待");
    expect(en.traveltrust_app_download_title).toMatch(/in development/i);
    const hero = read("components/traveltrust/cinematic/TravelTrustCinematicHero.tsx");
    expect(hero).toContain("TravelTrustAppDownloadDialog");
    expect(hero).toContain("data-tt-traveltrust-hero-cta-app");
    const appDialog = read("components/traveltrust/cinematic/TravelTrustAppDownloadDialog.tsx");
    expect(appDialog).toContain("data-tt-traveltrust-app-qr-placeholder");
    expect(appDialog).not.toMatch(/apps\.apple\.com|play\.google\.com|\.apk/i);
    expect(zh.traveltrust_app_download_body).not.toMatch(/立即下载|扫码下载|安装包已上架/);
    expect(en.traveltrust_app_download_body).not.toMatch(/scan to download|install now/i);
    expect(zh.traveltrust_liquidity_exchange_cta).toBe("规则预览");
    expect(en.traveltrust_liquidity_exchange_cta).toBe("Rules preview");
    expect(zh.traveltrust_ttg_alloc_burnable_badge).toBe("未售出可销毁");
    expect(en.traveltrust_ttg_alloc_burnable_badge).toMatch(/unsold/i);
    expect(en.traveltrust_ttg_alloc_burnable_badge).not.toMatch(/burnable/i);
    expect(zh.traveltrust_ttg_alloc_burnable_badge).not.toMatch(/保证|拉盘|升值/);
    expect(en.traveltrust_faq_q1).not.toMatch(/ICO/i);
    const trust = read("components/traveltrust/cinematic/TravelTrustTrustFactsStrip.tsx");
    expect(trust).not.toMatch(/className="sr-only"/);
    const gateway = read("components/traveltrust/cinematic/TravelTrustStablecoinGateway.tsx");
    expect(gateway).not.toContain("setWalletPromptOpen(true)");
    expect(gateway).not.toContain("onMockSwap");
  });
});
