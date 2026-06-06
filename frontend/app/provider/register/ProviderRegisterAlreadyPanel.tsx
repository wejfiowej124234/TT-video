"use client";

import Link from "next/link";
import { providerRegisterL5MainDataAttrs, TT_PROVIDER_REGISTER_L5 } from "@/lib/provider/providerRegisterL5";
import { guideRegLink, guideRegFocusRing } from "@/app/guide/register/guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export default function ProviderRegisterAlreadyPanel({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-small text-ink-300">{t("providerRegister_alreadyProvider")}</p>
      <Link
        href="/market/provider"
        className={`${touchTargetLink44Classes} inline-flex ${guideRegLink} ${guideRegFocusRing}`}
      >
        {t("providerRegister_goMarketStudio")}
      </Link>
    </div>
  );
}
