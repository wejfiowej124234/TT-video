import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type GovernanceHubSectionVariant = "hub" | "workspaceL5";

export function governanceHubSectionTokens(variant: GovernanceHubSectionVariant) {
  if (variant === "workspaceL5") {
    return {
      title: TT_WORKSPACE_L5.sectionTitle,
      subtitle: TT_WORKSPACE_L5.sectionSubtitle,
      body: "text-body text-slate-300",
      meta: "text-meta text-slate-400",
      metaMuted: "text-meta text-slate-500",
      mono: "break-all font-mono text-small text-slate-200",
      monoStrong: "break-all font-mono text-small text-[#fde9a8]",
      panel: "space-y-2 rounded-xl border border-ref-sun/18 bg-ref-sun/[0.04] p-3",
      innerPanel: "rounded-xl border border-ref-sun/14 bg-[#0c0a09]/45 px-3 py-2",
      divider: "border-t border-ref-sun/18 pt-4",
      badge:
        "inline-flex rounded-[var(--radius-sm)] border border-ref-sun/35 bg-ref-sun/10 px-2 py-1 text-small font-medium text-[#fde9a8]",
      list: "mt-1 list-disc pl-5 text-body text-slate-300",
    } as const;
  }
  return {
    title: "text-h4 font-medium text-ink-800",
    subtitle: "text-meta text-ink-600",
    body: "text-body text-ink-700",
    meta: "text-meta text-ink-600",
    metaMuted: "text-meta text-ink-500",
    mono: "mt-1 break-all font-mono text-small text-ink-800",
    monoStrong: "mt-1 break-all font-mono text-small text-ink-800",
    panel: "space-y-2 rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-700/60 dark:bg-ink-900/20",
    innerPanel:
      "rounded-[var(--radius-sm)] border border-ink-200/70 bg-white/60 px-3 py-2 dark:border-ink-700/60 dark:bg-ink-950/20",
    divider: "space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80",
    badge:
      "inline-flex rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ref-sun/10 px-2 py-1 text-small font-medium text-ink-800 dark:border-ref-sun/35 dark:bg-ref-sun/10 dark:text-ink-100",
    list: "mt-1 list-disc pl-5 text-body text-ink-700",
  } as const;
}
