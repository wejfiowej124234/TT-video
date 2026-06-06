import { redirect } from "next/navigation";

/**
 * 与壳层「帮助与支持」及 **31** 社区 IA 对齐：站内短路径 **`/community/guidelines`** → 规范正文 **`/terms/community-guidelines`**（与 **`CommunitySupportMenu`** 目标一致，避免双份正文）。
 */
export default function CommunityGuidelinesShortcutPage() {
  redirect("/terms/community-guidelines");
}
