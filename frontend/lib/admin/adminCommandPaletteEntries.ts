import { ADMIN_HOME_CARDS, ADMIN_HOME_SECTION_ORDER } from "@/lib/admin/adminHomeModel";
import { filterAdminHomeCardsForCapabilities } from "@/lib/admin/adminHomeCardPermission";
import { filterAdminHomeCardsForRole } from "@/lib/admin/adminHomeVisibility";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";

export type AdminCommandPaletteEntry = {
  href: string;
  titleKey: string;
  sectionKey: string;
  keywords: string[];
};

const EXTRA: AdminCommandPaletteEntry[] = [
  {
    href: "/admin",
    titleKey: "admin_shell_nav_workspace",
    sectionKey: "admin_shell_nav_workspace",
    keywords: ["home", "workspace", "工作台"],
  },
  {
    href: "/admin/inbox",
    titleKey: "admin_unified_inbox_title",
    sectionKey: "admin_shell_nav_workspace",
    keywords: ["inbox", "unified", "tasks", "queue", "待办", "收件箱"],
  },
  {
    href: "/admin/operator-guide",
    titleKey: "admin_operator_guide_title",
    sectionKey: "admin_home_maintainer_fold_summary",
    keywords: ["guide", "manual", "手册"],
  },
];

const INBOX_QUEUE_SHORTCUTS: AdminCommandPaletteEntry[] = [
  {
    href: ADMIN_INBOX_QUEUE_HREFS.provider,
    titleKey: "admin_home_inbox_provider",
    sectionKey: "admin_home_inbox_title",
    keywords: ["provider", "merchant", "onboarding", "submitted", "商家", "入驻", "queue", "待办"],
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.steward,
    titleKey: "admin_home_inbox_steward",
    sectionKey: "admin_home_inbox_title",
    keywords: ["steward", "stake", "region", "主理人", "质押", "queue", "待办"],
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.approvals,
    titleKey: "admin_home_inbox_approvals",
    sectionKey: "admin_home_inbox_title",
    keywords: ["approval", "approve", "pending", "高危", "审批", "待批", "queue"],
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.reports,
    titleKey: "admin_home_inbox_reports_queue",
    sectionKey: "admin_home_inbox_title",
    keywords: ["report", "community", "moderation", "open", "举报", "社区", "queue", "待办"],
  },
];

/** ① Phase ②/③ 六项剩余 backlog 预备深链（非 staging GO）。 */
const PHASE2_PREP_SHORTCUTS: AdminCommandPaletteEntry[] = [
  {
    href: "/admin/permissions#admin-phase2-remaining-backlog",
    titleKey: "admin_cmd_phase2_backlog",
    sectionKey: "admin_phase2_backlog_anchor",
    keywords: ["phase2", "backlog", "remaining", "ADM-UX", "②", "预备", "剩余"],
  },
  {
    href: "/admin/permissions#admin-console-role-effective",
    titleKey: "admin_cmd_console_role_effective",
    sectionKey: "admin_phase2_backlog_ia06_title",
    keywords: ["console", "role", "perspective", "shell", "ADM-U01", "控制台", "角色"],
  },
  {
    href: "/admin/onboarding/payment-events",
    titleKey: "admin_cmd_onboarding_stripe_echo",
    sectionKey: "admin_phase2_backlog_onb04_title",
    keywords: ["stripe", "webhook", "echo", "payment", "onboarding", "Stripe", "回显"],
  },
  {
    href: "/admin/finance-suite",
    titleKey: "admin_cmd_finance_suite_depth",
    sectionKey: "admin_phase2_backlog_fin02_title",
    keywords: ["finance", "settlement", "refund", "reconciliation", "depth", "财务", "七件套"],
  },
  {
    href: "/admin/operator-guide#admin-operator-guide-phase2-prep",
    titleKey: "admin_cmd_operator_phase2_prep",
    sectionKey: "admin_phase2_backlog_ci02_title",
    keywords: ["operator", "phase2", "closure", "skeleton", "CI-02", "运维", "收口"],
  },
];

function paletteDedupKey(href: string): string {
  const hashIdx = href.indexOf("#");
  const path = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const base = path.split("?")[0] ?? path;
  return `${base}${hash}`;
}

export function adminCommandPaletteEntries(
  actorRole: string | null,
  hasPermission: (perm: string) => boolean,
  permissionsLoaded: boolean,
): AdminCommandPaletteEntry[] {
  const byRole = filterAdminHomeCardsForRole(ADMIN_HOME_CARDS, actorRole);
  const visible = permissionsLoaded
    ? filterAdminHomeCardsForCapabilities(byRole, hasPermission)
    : byRole;

  const fromCards: AdminCommandPaletteEntry[] = visible.map((card) => ({
    href: card.href,
    titleKey: card.titleKey,
    sectionKey:
      ADMIN_HOME_SECTION_ORDER.find((s) => s.id === card.section)?.titleKey ??
      "admin_home_modules_aria",
    keywords: [
      paletteDedupKey(card.href).replace("/admin/", ""),
      ...(card.inboxKey ? ["inbox", "queue", "pending", "待办", card.inboxKey] : []),
    ],
  }));

  const seen = new Set<string>();
  const out: AdminCommandPaletteEntry[] = [];
  for (const e of [...EXTRA, ...INBOX_QUEUE_SHORTCUTS, ...PHASE2_PREP_SHORTCUTS, ...fromCards]) {
    const key = paletteDedupKey(e.href);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
