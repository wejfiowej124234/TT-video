import { redirect } from "next/navigation";

/** ① · TT 子站入口与发现流同源：`/community/explore`（非静态着陆占位） */
export default function TTCommunityPage() {
  redirect("/community/explore");
}
