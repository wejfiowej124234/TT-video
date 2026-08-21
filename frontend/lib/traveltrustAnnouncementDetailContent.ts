/** Pulse 公告详情弹层 · L5 Template v2 内容（kind / id 驱动 · 不增运营维度） */

import type { TravelTrustAnnouncement } from "./traveltrustNetworkAnnouncements";

export type TraveltrustAnnouncementDetailStep = {
  titleKey: string;
  bodyKey: string;
};

export type TraveltrustAnnouncementDetailRelated = {
  titleKey: string;
  summaryKey: string;
  href: string;
};

export type TraveltrustAnnouncementDetailTemplateVariant =
  | "trust_escrow"
  | "product_intro"
  | "generic";

export type TraveltrustAnnouncementDetailContent = {
  variant: TraveltrustAnnouncementDetailTemplateVariant;
  highlightKey: string;
  /** 您将获得 · 三条 bullet（locale key） */
  benefitBullets: string[];
  stepsSectionLabelKey: string;
  steps: TraveltrustAnnouncementDetailStep[];
  related: TraveltrustAnnouncementDetailRelated[];
};

const TRUST_ESCROW: TraveltrustAnnouncementDetailContent = {
  variant: "trust_escrow",
  highlightKey: "traveltrust_pulse_trust_escrow_core_highlight",
  benefitBullets: [
    "traveltrust_pulse_trust_escrow_core_benefit_b1",
    "traveltrust_pulse_trust_escrow_core_benefit_b2",
    "traveltrust_pulse_trust_escrow_core_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
  steps: [
    {
      titleKey: "traveltrust_pulse_trust_escrow_core_step1_title",
      bodyKey: "traveltrust_pulse_trust_escrow_core_step1_body",
    },
    {
      titleKey: "traveltrust_pulse_trust_escrow_core_step2_title",
      bodyKey: "traveltrust_pulse_trust_escrow_core_step2_body",
    },
    {
      titleKey: "traveltrust_pulse_trust_escrow_core_step3_title",
      bodyKey: "traveltrust_pulse_trust_escrow_core_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_params_title",
      summaryKey: "traveltrust_announcements_related_params_summary",
      href: "/governance/params",
    },
    {
      titleKey: "traveltrust_announcements_related_liquidity_title",
      summaryKey: "traveltrust_announcements_related_liquidity_summary",
      href: "/traveltrust#liquidity",
    },
  ],
};

const PRODUCT_INTRO: TraveltrustAnnouncementDetailContent = {
  variant: "product_intro",
  highlightKey: "traveltrust_pulse_product_intro_highlight",
  benefitBullets: [
    "traveltrust_pulse_product_intro_benefit_b1",
    "traveltrust_pulse_product_intro_benefit_b2",
    "traveltrust_pulse_product_intro_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_advantages",
  steps: [
    {
      titleKey: "traveltrust_pulse_product_intro_adv1_title",
      bodyKey: "traveltrust_pulse_product_intro_adv1_body",
    },
    {
      titleKey: "traveltrust_pulse_product_intro_adv2_title",
      bodyKey: "traveltrust_pulse_product_intro_adv2_body",
    },
    {
      titleKey: "traveltrust_pulse_product_intro_adv3_title",
      bodyKey: "traveltrust_pulse_product_intro_adv3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_plan_trip_title",
      summaryKey: "traveltrust_announcements_related_plan_trip_summary",
      href: "/travel",
    },
  ],
};

const DEPLOY_PHASE1: TraveltrustAnnouncementDetailContent = {
  variant: "generic",
  highlightKey: "traveltrust_pulse_deploy_phase1_highlight",
  benefitBullets: [
    "traveltrust_pulse_deploy_phase1_benefit_b1",
    "traveltrust_pulse_deploy_phase1_benefit_b2",
    "traveltrust_pulse_deploy_phase1_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_phase_opens",
  steps: [
    {
      titleKey: "traveltrust_pulse_deploy_phase1_step1_title",
      bodyKey: "traveltrust_pulse_deploy_phase1_step1_body",
    },
    {
      titleKey: "traveltrust_pulse_deploy_phase1_step2_title",
      bodyKey: "traveltrust_pulse_deploy_phase1_step2_body",
    },
    {
      titleKey: "traveltrust_pulse_deploy_phase1_step3_title",
      bodyKey: "traveltrust_pulse_deploy_phase1_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_params_title",
      summaryKey: "traveltrust_announcements_related_params_summary",
      href: "/governance/params",
    },
    {
      titleKey: "traveltrust_announcements_related_liquidity_title",
      summaryKey: "traveltrust_announcements_related_liquidity_summary",
      href: "/traveltrust#liquidity",
    },
  ],
};

const PHASE3_ENTRY: TraveltrustAnnouncementDetailContent = {
  variant: "trust_escrow",
  highlightKey: "traveltrust_pulse_phase3_entry_highlight",
  benefitBullets: [
    "traveltrust_pulse_phase3_entry_benefit_b1",
    "traveltrust_pulse_phase3_entry_benefit_b2",
    "traveltrust_pulse_phase3_entry_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
  steps: [
    {
      titleKey: "traveltrust_pulse_phase3_entry_step1_title",
      bodyKey: "traveltrust_pulse_phase3_entry_step1_body",
    },
    {
      titleKey: "traveltrust_pulse_phase3_entry_step2_title",
      bodyKey: "traveltrust_pulse_phase3_entry_step2_body",
    },
    {
      titleKey: "traveltrust_pulse_phase3_entry_step3_title",
      bodyKey: "traveltrust_pulse_phase3_entry_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_params_title",
      summaryKey: "traveltrust_announcements_related_params_summary",
      href: "/governance/params",
    },
  ],
};

const DEPLOY_PHASE2: TraveltrustAnnouncementDetailContent = {
  variant: "generic",
  highlightKey: "traveltrust_pulse_deploy_phase2_highlight",
  benefitBullets: [
    "traveltrust_pulse_deploy_phase2_benefit_b1",
    "traveltrust_pulse_deploy_phase2_benefit_b2",
    "traveltrust_pulse_deploy_phase2_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_phase_upgrades",
  steps: [
    {
      titleKey: "traveltrust_pulse_deploy_phase2_step1_title",
      bodyKey: "traveltrust_pulse_deploy_phase2_step1_body",
    },
    {
      titleKey: "traveltrust_pulse_deploy_phase2_step2_title",
      bodyKey: "traveltrust_pulse_deploy_phase2_step2_body",
    },
    {
      titleKey: "traveltrust_pulse_deploy_phase2_step3_title",
      bodyKey: "traveltrust_pulse_deploy_phase2_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_proposals_title",
      summaryKey: "traveltrust_announcements_related_proposals_summary",
      href: "/governance/proposals",
    },
    {
      titleKey: "traveltrust_announcements_related_params_title",
      summaryKey: "traveltrust_announcements_related_params_summary",
      href: "/governance/params",
    },
  ],
};

const DEPLOY_PHASE3: TraveltrustAnnouncementDetailContent = {
  variant: "generic",
  highlightKey: "traveltrust_pulse_deploy_phase3_highlight",
  benefitBullets: [
    "traveltrust_pulse_deploy_phase3_benefit_b1",
    "traveltrust_pulse_deploy_phase3_benefit_b2",
    "traveltrust_pulse_deploy_phase3_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_phase_upgrades",
  steps: [
    {
      titleKey: "traveltrust_pulse_deploy_phase3_step1_title",
      bodyKey: "traveltrust_pulse_deploy_phase3_step1_body",
    },
    {
      titleKey: "traveltrust_pulse_deploy_phase3_step2_title",
      bodyKey: "traveltrust_pulse_deploy_phase3_step2_body",
    },
    {
      titleKey: "traveltrust_pulse_deploy_phase3_step3_title",
      bodyKey: "traveltrust_pulse_deploy_phase3_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_params_title",
      summaryKey: "traveltrust_announcements_related_params_summary",
      href: "/governance/params",
    },
  ],
};

const PRODUCT_ITINERARY: TraveltrustAnnouncementDetailContent = {
  variant: "generic",
  highlightKey: "traveltrust_pulse_product_itinerary_highlight",
  benefitBullets: [
    "traveltrust_pulse_product_itinerary_benefit_b1",
    "traveltrust_pulse_product_itinerary_benefit_b2",
    "traveltrust_pulse_product_itinerary_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
  steps: [
    {
      titleKey: "traveltrust_pulse_product_itinerary_step1_title",
      bodyKey: "traveltrust_pulse_product_itinerary_step1_body",
    },
    {
      titleKey: "traveltrust_pulse_product_itinerary_step2_title",
      bodyKey: "traveltrust_pulse_product_itinerary_step2_body",
    },
    {
      titleKey: "traveltrust_pulse_product_itinerary_step3_title",
      bodyKey: "traveltrust_pulse_product_itinerary_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_market_title",
      summaryKey: "traveltrust_announcements_related_market_summary",
      href: "/market",
    },
  ],
};

const CAMPAIGN_REFERRAL: TraveltrustAnnouncementDetailContent = {
  variant: "generic",
  highlightKey: "traveltrust_pulse_campaign_referral_highlight",
  benefitBullets: [
    "traveltrust_pulse_campaign_referral_benefit_b1",
    "traveltrust_pulse_campaign_referral_benefit_b2",
    "traveltrust_pulse_campaign_referral_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
  steps: [
    {
      titleKey: "traveltrust_announcements_generic_campaign_step1_title",
      bodyKey: "traveltrust_announcements_generic_campaign_step1_body",
    },
    {
      titleKey: "traveltrust_announcements_generic_campaign_step2_title",
      bodyKey: "traveltrust_announcements_generic_campaign_step2_body",
    },
    {
      titleKey: "traveltrust_announcements_generic_campaign_step3_title",
      bodyKey: "traveltrust_announcements_generic_campaign_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_referral_center_title",
      summaryKey: "traveltrust_announcements_related_referral_center_summary",
      href: "/me/referrals",
    },
  ],
};

const COMMUNITY_GOVERNANCE: TraveltrustAnnouncementDetailContent = {
  variant: "generic",
  highlightKey: "traveltrust_pulse_community_governance_highlight",
  benefitBullets: [
    "traveltrust_pulse_community_governance_benefit_b1",
    "traveltrust_pulse_community_governance_benefit_b2",
    "traveltrust_pulse_community_governance_benefit_b3",
  ],
  stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
  steps: [
    {
      titleKey: "traveltrust_announcements_generic_community_step1_title",
      bodyKey: "traveltrust_announcements_generic_community_step1_body",
    },
    {
      titleKey: "traveltrust_announcements_generic_community_step2_title",
      bodyKey: "traveltrust_announcements_generic_community_step2_body",
    },
    {
      titleKey: "traveltrust_announcements_generic_community_step3_title",
      bodyKey: "traveltrust_announcements_generic_community_step3_body",
    },
  ],
  related: [
    {
      titleKey: "traveltrust_announcements_related_proposals_title",
      summaryKey: "traveltrust_announcements_related_proposals_summary",
      href: "/governance/proposals",
    },
  ],
};

const GENERIC_BY_KIND: Record<
  TravelTrustAnnouncement["kind"],
  Pick<TraveltrustAnnouncementDetailContent, "stepsSectionLabelKey" | "steps" | "related">
> = {
  trust: {
    stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
    steps: [],
    related: [
      {
        titleKey: "traveltrust_announcements_related_params_title",
        summaryKey: "traveltrust_announcements_related_params_summary",
        href: "/governance/params",
      },
    ],
  },
  product: {
    stepsSectionLabelKey: "traveltrust_announcements_detail_advantages",
    steps: [],
    related: [
      {
        titleKey: "traveltrust_announcements_related_plan_trip_title",
        summaryKey: "traveltrust_announcements_related_plan_trip_summary",
        href: "/travel",
      },
    ],
  },
  community: {
    stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
    steps: [
      {
        titleKey: "traveltrust_announcements_generic_community_step1_title",
        bodyKey: "traveltrust_announcements_generic_community_step1_body",
      },
      {
        titleKey: "traveltrust_announcements_generic_community_step2_title",
        bodyKey: "traveltrust_announcements_generic_community_step2_body",
      },
      {
        titleKey: "traveltrust_announcements_generic_community_step3_title",
        bodyKey: "traveltrust_announcements_generic_community_step3_body",
      },
    ],
    related: [
      {
        titleKey: "traveltrust_announcements_related_proposals_title",
        summaryKey: "traveltrust_announcements_related_proposals_summary",
        href: "/governance/proposals",
      },
    ],
  },
  campaign: {
    stepsSectionLabelKey: "traveltrust_announcements_detail_steps",
    steps: [
      {
        titleKey: "traveltrust_announcements_generic_campaign_step1_title",
        bodyKey: "traveltrust_announcements_generic_campaign_step1_body",
      },
      {
        titleKey: "traveltrust_announcements_generic_campaign_step2_title",
        bodyKey: "traveltrust_announcements_generic_campaign_step2_body",
      },
      {
        titleKey: "traveltrust_announcements_generic_campaign_step3_title",
        bodyKey: "traveltrust_announcements_generic_campaign_step3_body",
      },
    ],
    related: [
      {
        titleKey: "traveltrust_announcements_related_referral_center_title",
        summaryKey: "traveltrust_announcements_related_referral_center_summary",
        href: "/me/referrals",
      },
    ],
  },
};

export function resolveTraveltrustAnnouncementDetailContent(
  item: TravelTrustAnnouncement,
): TraveltrustAnnouncementDetailContent {
  if (
    item.id === "product-deploy-phase1" ||
    item.id === "trust-escrow-core" ||
    item.id === "product-intro"
  ) {
    return DEPLOY_PHASE1;
  }
  if (item.id === "phase3-entry-mainnet-prep") return PHASE3_ENTRY;
  if (item.id === "product-deploy-phase2") return DEPLOY_PHASE2;
  if (item.id === "product-deploy-phase3") return DEPLOY_PHASE3;
  if (item.id === "product-itinerary") return PRODUCT_ITINERARY;
  if (item.id === "campaign-referral") return CAMPAIGN_REFERRAL;
  if (item.id === "community-governance") return COMMUNITY_GOVERNANCE;

  const generic = GENERIC_BY_KIND[item.kind];
  const highlightKey = `${item.messageKey}_highlight`;
  return {
    variant: "generic",
    highlightKey,
    benefitBullets: [
      `${item.messageKey}_benefit_b1`,
      `${item.messageKey}_benefit_b2`,
      `${item.messageKey}_benefit_b3`,
    ],
    ...generic,
  };
}

/** 已翻译的 benefit bullet 文案（过滤缺失 key） */
export function resolveTraveltrustAnnouncementBenefitBullets(
  detail: TraveltrustAnnouncementDetailContent,
  t: (key: string) => string,
): string[] {
  return detail.benefitBullets
    .map((key) => ({ key, text: t(key) }))
    .filter(({ key, text }) => text !== key && text.trim().length > 0)
    .map(({ text }) => text);
}

/** highlight 存在且已翻译时展示 */
export function resolveTraveltrustAnnouncementHighlight(
  item: TravelTrustAnnouncement,
  detail: TraveltrustAnnouncementDetailContent,
  t: (key: string) => string,
): string | null {
  const text = t(detail.highlightKey);
  if (text === detail.highlightKey) {
    if (detail.variant !== "generic") return null;
    const benefit = t(`${item.messageKey}_benefit`);
    if (benefit === `${item.messageKey}_benefit`) return null;
    return benefit.length > 72 ? `${benefit.slice(0, 69)}…` : benefit;
  }
  return text;
}
