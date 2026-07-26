/** ① Admin 侧栏 · 16px 线型图标（扫视 · 非 emoji）· Batch-9 U2 叶图标唯一 */
export type AdminShellNavIconId =
  | "workspace"
  | "inbox"
  | "onboarding"
  | "operations"
  | "community"
  | "finance"
  | "governance"
  | "more"
  | "platform"
  | "orders"
  | "users"
  | "guides"
  | "disputes"
  | "content"
  | "centers"
  | "official"
  | "growth"
  | "config"
  | "default";

const PATHS: Record<AdminShellNavIconId, string> = {
  workspace: "M4 6h16v12H4z M8 6V4h8v2",
  inbox: "M4 8l8 5 8-5v10H4V8z",
  /** HU-226 · 入驻：剪贴板勾选（≠ 平台井号格） */
  onboarding: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4",
  operations: "M4 7h16M4 12h10M4 17h7",
  community: "M8 10a4 4 0 108 0 4 4 0 10-8 0M4 20c0-3 3.5-5 8-5s8 2 8 5",
  finance: "M12 3v18M7 8h10M7 12h10",
  governance: "M12 3l9 5-9 5-9-5 9-5zM4 14l8 4 8-4",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  /** HU-226 · 平台：楼宇轮廓（≠ 井号格 / ≠ 内容页） */
  platform: "M3 21h18M5 21V9l7-4 7 4v12M9 21v-5h6v5M10 12h.01M14 12h.01",
  orders: "M6 6h12v12H6z M9 10h6M9 14h4",
  users: "M10 11a3 3 0 100-6 3 3 0 000 6M4 20c0-3 2.5-5 6-5s6 2 6 5",
  guides: "M12 3l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z",
  disputes: "M12 8v5M12 16h.01M12 3a9 9 0 110 18 9 9 0 010-18z",
  /** 内容叶：单页文档 */
  content: "M7 4h10v16H7z M10 8h4M10 12h4M10 16h2",
  /** HU-226 · 内容与增长组：叠层卡片（≠ 内容叶单页） */
  centers: "M6 8h12v12H6z M8 5h12v12",
  /** Batch-11 W14 HU-316 · 官方：盾形验真（≠ 虚线靶心） */
  official: "M12 3l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V7l8-4z M9.5 12l2 2 3.5-3.5",
  growth: "M4 18V10M10 18V6M16 18v-8M20 18H3",
  config: "M12 8a4 4 0 100 8 4 4 0 000-8z M4.5 12H8M16 12h3.5M12 4.5V8M12 16v3.5",
  default: "M4 6h16v12H4z",
};

export function adminShellNavIconIdForGroup(groupId: string): AdminShellNavIconId {
  switch (groupId) {
    case "workspace":
      return "workspace";
    case "onboarding":
      return "onboarding";
    case "operations":
      return "operations";
    case "content":
    case "official_ops":
      return "centers";
    case "growth":
      return "growth";
    case "community":
      return "community";
    case "finance":
      return "finance";
    case "governance":
      return "governance";
    case "more":
      return "platform";
    default:
      return "default";
  }
}

export function adminShellNavIconIdForHref(href: string): AdminShellNavIconId {
  const base = href.split("?")[0] ?? href;
  if (base === "/admin" || base === "/admin/") return "workspace";
  if (base === "/admin/inbox") return "inbox";
  if (base.includes("/orders")) return "orders";
  if (base.includes("/users")) return "users";
  if (base.includes("/guides")) return "guides";
  if (base.includes("/disputes")) return "disputes";
  if (base.includes("/community") || base.includes("/reports")) return "community";
  if (base.includes("/onboarding") || base.includes("/provider") || base.includes("/steward"))
    return "onboarding";
  if (base.includes("/content")) return "content";
  if (base.includes("/official")) return "official";
  if (base.includes("/growth")) return "growth";
  if (base.includes("/config")) return "config";
  if (base.includes("/finance") || base.includes("/fee-router")) return "finance";
  if (
    base.includes("/cross-check") ||
    base.includes("/drift") ||
    base.includes("/governance")
  )
    return "governance";
  return "default";
}

export function AdminShellNavIcon(props: {
  id: AdminShellNavIconId;
  className?: string;
}) {
  const { id, className = "" } = props;
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      data-tt-admin-shell-nav-icon={id}
      data-tt-admin-shell-nav-icon-stroke="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <path d={PATHS[id]} />
    </svg>
  );
}
