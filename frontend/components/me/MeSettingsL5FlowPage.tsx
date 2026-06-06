"use client";

import { MeSettingsL5MinimalFooter } from "@/components/me/MeSettingsL5MinimalFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 设置 Hub / 改密等同族 L5 页壳（居中 · max-w-3xl · 精简底栏） */
export default function MeSettingsL5FlowPage({
  ariaLabel,
  ariaLabelledby,
  route,
  dataAttrs = {},
  children,
  showMinimalFooter = true,
}: {
  ariaLabel?: string;
  ariaLabelledby?: string;
  route: string;
  dataAttrs?: Record<string, string>;
  children: React.ReactNode;
  showMinimalFooter?: boolean;
}) {
  const a11yMain =
    ariaLabelledby != null
      ? { "aria-labelledby": ariaLabelledby }
      : { "aria-label": ariaLabel ?? route };

  return (
    <main
      className={TT_ME_SETTINGS_L5.pageShell}
      {...a11yMain}
      data-tt-auth-root="1"
      data-tt-auth-route={route}
      data-tt-auth-visual="l5"
      {...dataAttrs}
    >
      <AuthL5PageBackdrop />
      <div className={TT_ME_SETTINGS_L5.pageColumn}>
        {children}
        {showMinimalFooter ? <MeSettingsL5MinimalFooter /> : null}
      </div>
    </main>
  );
}
