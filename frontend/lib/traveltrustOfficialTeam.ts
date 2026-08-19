/** TravelTrust Studio · `/traveltrust` footer official-team dialog (local product surface). */
/** Owner 写入真实 `/in/{slug}` 前保持 null，禁止跳转 LinkedIn 首页冒充已核验。 */
export const TRAVELTRUST_OFFICIAL_TEAM_LINKEDIN: string | null = null;

export const TRAVELTRUST_OFFICIAL_TEAM = [
  {
    id: "founder",
    image: "/media/traveltrust/team/member-01-v2.png",
    nameKey: "traveltrust_official_team_m1_name",
    roleKey: "traveltrust_official_team_m1_role",
    bioKey: "traveltrust_official_team_m1_bio",
    locationKey: "traveltrust_official_team_m1_location",
    linkedinUrl: TRAVELTRUST_OFFICIAL_TEAM_LINKEDIN,
  },
  {
    id: "coo",
    image: "/media/traveltrust/team/member-02-v3.png",
    nameKey: "traveltrust_official_team_m2_name",
    roleKey: "traveltrust_official_team_m2_role",
    bioKey: "traveltrust_official_team_m2_bio",
    locationKey: "traveltrust_official_team_m2_location",
    linkedinUrl: TRAVELTRUST_OFFICIAL_TEAM_LINKEDIN,
  },
  {
    id: "clo",
    image: "/media/traveltrust/team/member-03-v3.png",
    nameKey: "traveltrust_official_team_m3_name",
    roleKey: "traveltrust_official_team_m3_role",
    bioKey: "traveltrust_official_team_m3_bio",
    locationKey: "traveltrust_official_team_m3_location",
    linkedinUrl: TRAVELTRUST_OFFICIAL_TEAM_LINKEDIN,
  },
  {
    id: "engineer_a",
    image: "/media/traveltrust/team/member-04-v2.png",
    nameKey: "traveltrust_official_team_m4_name",
    roleKey: "traveltrust_official_team_m4_role",
    bioKey: "traveltrust_official_team_m4_bio",
    locationKey: "traveltrust_official_team_m4_location",
    linkedinUrl: TRAVELTRUST_OFFICIAL_TEAM_LINKEDIN,
  },
  {
    id: "engineer_b",
    image: "/media/traveltrust/team/member-05-v2.png",
    nameKey: "traveltrust_official_team_m5_name",
    roleKey: "traveltrust_official_team_m5_role",
    bioKey: "traveltrust_official_team_m5_bio",
    locationKey: "traveltrust_official_team_m5_location",
    linkedinUrl: TRAVELTRUST_OFFICIAL_TEAM_LINKEDIN,
  },
] as const;
