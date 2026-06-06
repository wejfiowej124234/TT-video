/**
 * `/traveltrust` 本地目视 QA 清单（① 本地阶段 · 发版前勾选）
 * 自动化不替代本表；globe / 缝 / nav 需浏览器确认。
 */
export const TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST = [
  {
    id: "globe-entrance",
    label: "每次进入/刷新 Hero：地球 entrance 缩放动画完整播放",
    path: "/traveltrust#hero",
  },
  {
    id: "hero-split-seam",
    label: "Hero 左右分栏：copy / globe 无裁切错位，warm scrim 与 canvas 接缝干净",
    path: "/traveltrust",
  },
  {
    id: "landing-nav-sticky",
    label: "Landing chrome sticky：滚动时双行 HUD、进度条、章节高亮正常",
    path: "/traveltrust",
  },
  {
    id: "below-fold-film-dividers",
    label: "Below-fold：2 条 Film divider（margin-only）无压暗渐变接缝",
    path: "/traveltrust#roles",
  },
  {
    id: "economy-cluster-atmosphere",
    label: "Economy 三联：单簇氛围 radial + liquidity/trust/settlement 纵向节奏",
    path: "/traveltrust#liquidity",
  },
  {
    id: "theater-viewport-sync",
    label: "Roles theater：viewport anchor 驱动页级 3D 无抖动（±6px 节流）",
    path: "/traveltrust#roles",
  },
  {
    id: "hash-scroll",
    label: "Hash 深链 #roles #liquidity #faq #start 平滑滚入且不挡入口闸",
    path: "/traveltrust#faq",
  },
  {
    id: "entry-gate",
    label: "入口闸：brief 就绪前进度条，超时 ≤8s 仍可进入主列",
    path: "/traveltrust",
  },
  {
    id: "reduced-motion",
    label: "prefers-reduced-motion：通知可见、占位脉冲降级、地球 entrance 仍可用",
    path: "/traveltrust",
  },
  {
    id: "grouped-footer",
    label: "Close 章：Start CTA 栈 + grouped footer 无顶边重复 seam",
    path: "/traveltrust#start",
  },
] as const;

export type TraveltrustHomeVisualQaItemId = (typeof TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST)[number]["id"];
