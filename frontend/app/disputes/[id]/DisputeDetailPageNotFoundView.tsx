"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { meSettingsDisputesHrefSuffix } from "@/lib/me/meSettingsExtensionContext";
import { DisputesL5FooterLinks } from "@/components/disputes/DisputesL5FooterLinks";
import { DisputesL5PageShell } from "@/components/disputes/DisputesL5PageShell";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";

type Props = Pick<DisputeDetailPageModel, "t">;

export function DisputeDetailPageNotFoundView({ t }: Props) {
  const searchParams = useSearchParams();
  const disputesListHref = `/disputes${meSettingsDisputesHrefSuffix(searchParams.get("from"))}`;

  return (
    <DisputesL5PageShell t={t} ariaLabel={t("dispute_detailTitle")} variant="detail">
      <div className="space-y-4" data-tt-dispute-detail-page="1">
        <h1 className="sr-only">{t("dispute_notFound")}</h1>
        <p className={TT_DISPUTES_L5.detailBody}>{t("dispute_notFound")}</p>
        <Link href={disputesListHref} className={TT_DISPUTES_L5.listLink}>
          {t("dispute_backList")}
        </Link>
        <DisputesL5FooterLinks t={t} showList />
      </div>
    </DisputesL5PageShell>
  );
}
