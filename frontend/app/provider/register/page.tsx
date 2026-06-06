"use client";

import { GuideRegisterRouteSuspense } from "@/components/guide/GuideRegisterRouteSuspense";
import { ProviderRegisterPageMain } from "./ProviderRegisterPageMain";

export default function ProviderRegisterPage() {
  return (
    <GuideRegisterRouteSuspense>
      <ProviderRegisterPageMain />
    </GuideRegisterRouteSuspense>
  );
}
