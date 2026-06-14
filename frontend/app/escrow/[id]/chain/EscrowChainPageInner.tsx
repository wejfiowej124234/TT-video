"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { EscrowChainPageMain } from "./EscrowChainPageMain";

export function EscrowChainPageInner() {
  const { t } = useTranslation();
  const params = useParams();
  const idRaw = typeof params?.id === "string" ? params.id.trim() : "";

  if (!idRaw) {
    return (
      <p className="text-small text-slate-300" role="alert">
        {t("escrow_chain_missing_id")}
      </p>
    );
  }

  return <EscrowChainPageMain escrowId={idRaw} />;
}
