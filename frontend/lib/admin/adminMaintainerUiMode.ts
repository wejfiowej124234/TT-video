/** ① · 维护者 UI（DB/视角快切/本地徽章）仅 super_admin 或显式 env。 */
export function isAdminMaintainerUi(actorRole: string | null | undefined): boolean {
  if (process.env.NEXT_PUBLIC_ADMIN_MAINTAINER_UI === "1") return true;
  const r = (actorRole ?? "").trim().toLowerCase();
  return r === "super_admin";
}
