/**
 * 37 §3.1 — 社区深底页面可复用的 focus-visible 片段；与 premium 页身 `#0a0a0a` 一致。
 * 新社区内页优先拼接本文件常量，避免与壳层漂移。
 */
const OFF_INK = "focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

/** layout：桌面/移动 Tab（暖金 focus · 与 marketingUi L0 同族） */
export const communityShellTabFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${OFF_INK}`;

/** layout：顶栏/移动标题旁文字链 */
export const communityHeaderInlineFocus =
  `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-sm px-0.5`;

/** 发布 + 圆形 FAB（全站主题 V1 · 暖金 focus） */
export const communityPublishFabFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/75 ${OFF_INK}`;

/** 暖金描边 pill / 页内主按钮（原 cyan pill · 主题 V1 L5） */
export const communityCyanPillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${OFF_INK}`;

/** 暖金 pill focus（保留 `communityFuchsiaPillFocus` 名以兼容旧 import · 225-G · D8） */
export const communityFuchsiaPillFocus = communityCyanPillFocus;

/** 深底幽灵 pill（暖金 focus · 与 marketingUi L5 同族） */
export const communitySlatePillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 ${OFF_INK}`;

/** 22 `--warning`：金徽章 / 离线提示 / 举报主 CTA 等与琥珀色控件共用焦点环 */
export const communityWarningPillFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-warning/75 ${OFF_INK}`;

/** 与 `communityWarningPillFocus` 同义，保留旧 import 兼容 */
export const communityAmberPillFocus = communityWarningPillFocus;

/** 纯文字链 focus（保留旧名 · 暖金 · 225-G） */
export const communityFuchsiaTextFocus = communityHeaderInlineFocus;

/** 大卡片链接（作者格、快捷入口 grid） */
export const communityCardLinkFocus = `focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 ${OFF_INK}`;

/** 会话列表整行可聚焦 */
export const communityConversationRowFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/45";

/** 「我的」内容 Tab 横条（与底边指示共存） */
export const communityMeTabBarLinkFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/40";

/** 好友/会话列表等圆形头像链 */
export const communityAvatarLinkFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";
