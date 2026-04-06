/**
 * 37 §3.1 — 社区深底（slate-950）页面可复用的 focus-visible 片段；与 app/community/layout 壳一致。
 * 新社区内页优先拼接本文件常量，避免与壳层漂移。
 */
const OFF950 = "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/** layout：桌面/移动 Tab、与壳内 COMM_TAB_FOCUS 同义 */
export const communityShellTabFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/85 ${OFF950}`;

/** layout：顶栏/移动标题旁文字链；略浅底用 slate-900 offset */
export const communityHeaderInlineFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm px-0.5";

/** 发布 + 圆形 FAB */
export const communityPublishFabFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/90 ${OFF950}`;

/** cyan 描边 pill / 主按钮 */
export const communityCyanPillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${OFF950}`;

/** fuchsia 描边 pill */
export const communityFuchsiaPillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/80 ${OFF950}`;

/** slate 幽灵 pill */
export const communitySlatePillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70 ${OFF950}`;

/** 22 `--warning`：金徽章 / 离线提示 / 举报主 CTA 等与琥珀色控件共用焦点环 */
export const communityWarningPillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-warning/75 ${OFF950}`;

/** 与 `communityWarningPillFocus` 同义，保留旧 import 兼容 */
export const communityAmberPillFocus = communityWarningPillFocus;

/** 纯文字链（品红强调） */
export const communityFuchsiaTextFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 ${OFF950} rounded-sm px-0.5`;

/** 大卡片链接（作者格、快捷入口 grid） */
export const communityCardLinkFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55 ${OFF950}`;

/** 会话列表整行可聚焦 */
export const communityConversationRowFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/45";

/** 「我的」内容 Tab 横条（与底边指示共存） */
export const communityMeTabBarLinkFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/40";

/** 好友/会话列表等圆形头像链 */
export const communityAvatarLinkFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
