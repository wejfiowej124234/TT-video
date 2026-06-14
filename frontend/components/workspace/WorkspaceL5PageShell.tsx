"use client";

import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import {
  MeSettingsL5MinimalFooter,
  type MeSettingsL5FooterTarget,
} from "@/components/me/MeSettingsL5MinimalFooter";
import {
  TT_WORKSPACE_L5,
  workspaceWorkbenchL5DataAttrs,
  type WorkspaceL5Kind,
} from "@/lib/workspace/workspaceWorkbenchL5";

/** 经营工作台 L5 页壳（暖金暗场 · 与设置 Hub 同族） */
export default function WorkspaceL5PageShell({
  kind,
  ariaLabel,
  dataAttrs = {},
  children,
  showMinimalFooter = true,
  footerTarget,
}: {
  kind: WorkspaceL5Kind;
  ariaLabel: string;
  dataAttrs?: Record<string, string>;
  children: React.ReactNode;
  /** @deprecated 优先用 `footerTarget` */
  showMinimalFooter?: boolean;
  footerTarget?: MeSettingsL5FooterTarget | "none";
}) {
  const resolvedFooterTarget: MeSettingsL5FooterTarget | "none" =
    footerTarget ?? (showMinimalFooter ? "community" : "none");
  return (
    <main
      className={TT_WORKSPACE_L5.pageShell}
      aria-label={ariaLabel}
      data-tt-auth-root="1"
      {...workspaceWorkbenchL5DataAttrs(kind)}
      {...dataAttrs}
    >
      <AuthL5PageBackdrop />
      <div className={TT_WORKSPACE_L5.pageColumn}>
        {children}
        {resolvedFooterTarget !== "none" ? (
          <MeSettingsL5MinimalFooter target={resolvedFooterTarget} />
        ) : null}
      </div>
    </main>
  );
}
