/** ① Admin 侧栏 · 16px 线型图标（扫视 · 非 emoji） */
export type AdminShellNavIconId =
  | "workspace"
  | "inbox"
  | "onboarding"
  | "operations"
  | "community"
  | "finance"
  | "governance"
  | "more"
  | "orders"
  | "users"
  | "disputes"
  | "default";

const PATHS: Record<AdminShellNavIconId, string> = {
  workspace: "M4 6h16v12H4z M8 6V4h8v2",
  inbox: "M4 8l8 5 8-5v10H4V8z",
  onboarding: "M12 4v16M8 8h8M8 12h8M8 16h5",
  operations: "M4 7h16M4 12h10M4 17h7",
  community: "M8 10a4 4 0 108 0 4 4 0 10-8 0M4 20c0-3 3.5-5 8-5s8 2 8 5",
  finance: "M12 3v18M7 8h10M7 12h10",
  governance: "M12 3l9 5-9 5-9-5 9-5zM4 14l8 4 8-4",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  orders: "M6 6h12v12H6z M9 10h6M9 14h4",
  users: "M10 11a3 3 0 100-6 3 3 0 000 6M4 20c0-3 2.5-5 6-5s6 2 6 5",
  disputes: "M12 8v5M12 16h.01M12 3a9 9 0 110 18 9 9 0 010-18z",
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
    case "community":
      return "community";
    case "finance":
      return "finance";
    case "governance":
      return "governance";
    case "more":
      return "more";
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
  if (base.includes("/disputes")) return "disputes";
  if (base.includes("/community") || base.includes("/reports")) return "community";
  if (base.includes("/onboarding") || base.includes("/provider") || base.includes("/steward"))
    return "onboarding";
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
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <path d={PATHS[id]} />
    </svg>
  );
}
