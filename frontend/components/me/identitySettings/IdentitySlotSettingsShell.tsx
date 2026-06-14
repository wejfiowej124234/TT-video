"use client";

import Link from "next/link";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export function IdentitySlotSettingsShell({
  route,
  dataAttrs,
  ariaLabel,
  backHref,
  backLabelKey,
  eyebrowKey,
  titleKey,
  subtitleKey,
  t,
  children,
  showMinimalFooter = true,
}: {
  route: string;
  dataAttrs?: Record<string, string>;
  ariaLabel: string;
  backHref?: string;
  backLabelKey: string;
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  t: (key: string) => string;
  children: React.ReactNode;
  showMinimalFooter?: boolean;
}) {
  return (
    <MeSettingsL5FlowPage
      ariaLabel={ariaLabel}
      route={route}
      dataAttrs={dataAttrs}
      showMinimalFooter={showMinimalFooter}
    >
      <Link href={backHref ?? ME_IDENTITIES_HUB_PATH} className={TT_ME_SETTINGS_L5.backLink}>
        ← {t(backLabelKey)}
      </Link>

      <header className={TT_IDENTITY_SLOT_SETTINGS_L5.headerCard}>
        <p className={TT_IDENTITY_SLOT_SETTINGS_L5.headerEyebrow}>{t(eyebrowKey)}</p>
        <h1 className={`${TT_IDENTITY_SLOT_SETTINGS_L5.headerTitle} mt-1`}>{t(titleKey)}</h1>
        <p className={TT_IDENTITY_SLOT_SETTINGS_L5.headerSubtitle}>{t(subtitleKey)}</p>
      </header>

      <div className="flex flex-col gap-5 sm:gap-6">{children}</div>
    </MeSettingsL5FlowPage>
  );
}
