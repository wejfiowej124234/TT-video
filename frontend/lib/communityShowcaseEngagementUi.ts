import { isShowcasePostId } from "@/lib/communityShowcase";

/** 演示帖互动计数/按钮 a11y 后缀（① 本机临时 · 非 API 持久化） */
export function communityShowcaseEngagementAriaSuffix(t: (key: string) => string): string {
  return t("community_showcase_engagement_demo_aria");
}

export function communityShowcaseEngagementButtonAria(
  t: (key: string) => string,
  baseLabelKey: string,
  count: number,
  postId: string,
): string {
  const base = t(baseLabelKey);
  if (!isShowcasePostId(postId)) return `${base}, ${count}`;
  return `${base}, ${count}, ${communityShowcaseEngagementAriaSuffix(t)}`;
}

/** 演示帖互动数字样式（弱化 mock 计数视觉权重） */
export function communityShowcaseEngagementCountClassName(postId: string): string {
  return isShowcasePostId(postId)
    ? "tabular-nums text-slate-500/55 font-normal"
    : "tabular-nums text-slate-200";
}
