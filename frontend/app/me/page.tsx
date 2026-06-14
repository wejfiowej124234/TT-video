import { redirect } from "next/navigation";

import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";

/** `/me` 直链 → 多重身份 Hub（社区 Feed 为登录默认；见 `postAuthReturnPath`）。 */
export default function MeIndexPage() {
  redirect(ME_IDENTITIES_HUB_PATH);
}
