"use client";



import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";

import { TT_ESCROW_EXPERIENCE_PANEL } from "@/lib/escrowExperienceUi";



/** ① Draft pre-escrow: travel-friendly compliance; full protocol copy stays in <details>. */

export default function EscrowDraftTravelNotice({ compact = false }: { compact?: boolean }) {

  const { t } = useTranslation();

  const detailsId = useId();

  const detailsBody = (

    <div className="mt-2 space-y-3 text-meta text-slate-300 leading-relaxed">

      <p>{t("escrow_draftTravelNotice_cancelShort")}</p>

      <p>{t("escrow_irreversible")}</p>

      <p>{t("order_emergencyContact")}</p>

    </div>

  );



  if (compact) {

    return (

      <details className="w-full sm:w-auto text-small text-slate-200">

        <summary className="tt-escrow-experience-footer-action text-ref-sun font-medium cursor-pointer list-none [&::-webkit-details-marker]:hidden underline-offset-2 hover:underline hover:text-[#ffe9a8]">

          {t("escrow_draftTravelNotice_detailsToggle")}

        </summary>

        {detailsBody}

      </details>

    );

  }



  return (

    <div className={`${TT_ESCROW_EXPERIENCE_PANEL} p-4 space-y-2`} role="region" aria-labelledby={detailsId}>

      <p id={detailsId} className="text-small text-slate-200 leading-relaxed">

        {t("escrow_draftTravelNotice_lead")}

      </p>

      <details className="group">

        <summary className="text-meta text-ref-sun/90 cursor-pointer list-none [&::-webkit-details-marker]:hidden">

          <span className="underline-offset-2 group-open:underline">{t("escrow_draftTravelNotice_detailsToggle")}</span>

        </summary>

        {detailsBody}

      </details>

    </div>

  );

}

