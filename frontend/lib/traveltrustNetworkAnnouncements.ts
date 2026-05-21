/** 网络页数字公告 — ① 本地静态；② 可换 API `GET /api/v1/traveltrust/announcements` */

export type TravelTrustAnnouncementKind = "release" | "governance" | "campaign" | "ops";

export type TravelTrustAnnouncement = {
  id: string;
  kind: TravelTrustAnnouncementKind;
  /** i18n key */
  messageKey: string;
  href?: string;
  /** ISO date for HUD display */
  at: string;
};

export const TRAVELTRUST_NETWORK_ANNOUNCEMENTS: TravelTrustAnnouncement[] = [
  {
    id: "v6-cinematic",
    kind: "release",
    messageKey: "traveltrust_pulse_v6_cinematic",
    href: "/traveltrust",
    at: "2026-05-18",
  },
  {
    id: "escrow-usdc",
    kind: "ops",
    messageKey: "traveltrust_pulse_escrow_usdc",
    href: "/help",
    at: "2026-05-17",
  },
  {
    id: "governance-vote",
    kind: "governance",
    messageKey: "traveltrust_pulse_governance_vote",
    href: "/governance",
    at: "2026-05-15",
  },
  {
    id: "phase1-countries",
    kind: "campaign",
    messageKey: "traveltrust_pulse_phase1_countries",
    href: "/governance/protocol-reference",
    at: "2026-05-10",
  },
];
