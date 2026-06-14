"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { EscrowProofPageMain } from "./EscrowProofPageMain";

export function EscrowProofPageInner() {
  const { t } = useTranslation();
  const params = useParams();
  const idRaw = typeof params?.id === "string" ? params.id.trim() : "";

  if (!idRaw) {
    return (
      <p className="text-small text-slate-300" role="alert">
        {t("escrow_proof_missing_id")}
      </p>
    );
  }

  return <EscrowProofPageMain escrowId={idRaw} />;
}
