import { ADMIN_PERM, type AdminPermissionId } from "./adminPermissionIds";

/** Lane (CMS ops) → audience permission · mirrors registry + Rust `cms_announcement_lane_rbac`. */
export function adminPermissionForCmsAnnouncementLane(lane: string): AdminPermissionId | null {
  switch (lane) {
    case "product":
      return ADMIN_PERM.ANNOUNCEMENT_AUDIENCE_PUBLIC_USER;
    case "governance":
      return ADMIN_PERM.ANNOUNCEMENT_AUDIENCE_TOKEN_HOLDER;
    case "protocol_status":
      return ADMIN_PERM.ANNOUNCEMENT_AUDIENCE_TECHNICAL_PUBLIC;
    case "roadmap":
      return ADMIN_PERM.ANNOUNCEMENT_AUDIENCE_PUBLIC_USER;
    default:
      return null;
  }
}

export function canAdminMutateCmsAnnouncementLane(
  hasPermission: (id: AdminPermissionId) => boolean,
  lane: string,
  publish: boolean,
): boolean {
  const lanePerm = adminPermissionForCmsAnnouncementLane(lane);
  if (!lanePerm) return false;
  const base = publish ? ADMIN_PERM.CONTENT_PUBLISH : ADMIN_PERM.CONTENT_WRITE;
  return hasPermission(base) && hasPermission(lanePerm);
}
