import { redirect } from "next/navigation";

import { POST_AUTH_DEFAULT_RETURN_PATH } from "@/lib/auth/postAuthReturnPath";

/** `/me` 默认入口 → 多重身份 Hub（社区资料见 `/community/me`）。 */
export default function MeIndexPage() {
  redirect(POST_AUTH_DEFAULT_RETURN_PATH);
}
