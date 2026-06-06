"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import TrustTransparencyHub from "@/components/trust/TrustTransparencyHub";
import {
  MeSettingsExtensionIngressBlock,
  meSettingsExtensionIngressDataAttrs,
} from "@/components/me/MeSettingsExtensionIngressBlock";
import { isMeSettingsExtensionFromQuery } from "@/lib/me/meSettingsExtensionContext";

function TrustPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromSettings = isMeSettingsExtensionFromQuery(searchParams.get("from"));

  return (
    <div {...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-trust-from-settings")}>
      <MeSettingsExtensionIngressBlock
        fromSettings={fromSettings}
        noticeKey="me_settings_trust_center_from_settings_notice"
        t={t}
      />
      <TrustTransparencyHub fromSettings={fromSettings} />
    </div>
  );
}

/** P-UX1 / P-UX2：信任中心 — 用户路径入口 `/trust` */
export default function TrustPage() {
  return (
    <Suspense fallback={null}>
      <TrustPageInner />
    </Suspense>
  );
}
