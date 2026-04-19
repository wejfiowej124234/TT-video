import { redirect } from "next/navigation";

/** 个人中心主入口已并入 TT 社区 `/community/me`（顶栏「个人中心」与社区底栏一致）。 */
export default function MeIndexPage() {
  redirect("/community/me");
}
