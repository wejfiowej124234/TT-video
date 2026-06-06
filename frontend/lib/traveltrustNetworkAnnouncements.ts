/** 网络页数字公告 — ① 本地静态；② 可换 API `GET /api/v1/traveltrust/announcements` */

/** 公告归档页（跑马灯 / 「全部」统一落地，勿直链帮助中心等） */
export const TRAVELTRUST_ANNOUNCEMENTS_PATH = "/traveltrust/announcements";

export function traveltrustAnnouncementPageHref(announcementId?: string): string {
  if (!announcementId) return TRAVELTRUST_ANNOUNCEMENTS_PATH;
  return `${TRAVELTRUST_ANNOUNCEMENTS_PATH}#${announcementId}`;
}

export type TravelTrustAnnouncementKind = "release" | "governance" | "campaign" | "ops";
export type TravelTrustAnnouncement = {
  id: string;
  kind: TravelTrustAnnouncementKind;
  /** i18n key */
  messageKey: string;
  /** 预留外链（① 静态；详情弹层不跳转，仅展示全文） */
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

/** 项目动态时间线：最新在上（弹层 / 归档列表共用） */
export function listTraveltrustNetworkAnnouncementsNewestFirst(): TravelTrustAnnouncement[] {
  return [...TRAVELTRUST_NETWORK_ANNOUNCEMENTS].sort((a, b) => b.at.localeCompare(a.at));
}
