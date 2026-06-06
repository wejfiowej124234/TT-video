"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { escrowExperienceMetaClass } from "@/lib/escrowExperienceUi";

export interface EscrowDraftAdvancedProtocolFoldProps {
  /** 确认终版后默认展开链上/角色操作区 */
  defaultOpen?: boolean;
  children: ReactNode;
}

/** ① Experience 草稿：链上托管 / 角色操作 / 证据等默认折叠，减少抢主任务视线 */
export default function EscrowDraftAdvancedProtocolFold({
  defaultOpen = false,
  children,
}: EscrowDraftAdvancedProtocolFoldProps) {
  const { t } = useTranslation();

  return (
    <details
      className="mb-4 rounded-[var(--radius-md)] border border-white/12 bg-black/20 group"
      open={defaultOpen || undefined}
    >
      <summary
        className="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-small font-semibold text-ref-sun/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-[var(--radius-md)]"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span>{t("escrow_draftProtocolFold_title")}</span>
          <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-meta font-medium text-amber-200/95">
            {t("escrow_draftProtocolFold_devBadge")}
          </span>
        </span>
        <span className={`${escrowExperienceMetaClass} font-normal text-white/55`}>
          {t("escrow_draftProtocolFold_hint")}
        </span>
      </summary>
      <div className="px-4 pb-4 pt-3 space-y-4 border-t border-white/8">{children}</div>
    </details>
  );
}
