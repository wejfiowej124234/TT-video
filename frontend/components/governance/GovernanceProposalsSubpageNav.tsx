"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";
import { governanceProposalsListHref } from "@/lib/governance/governanceProposalsNavModel";
import { StewardWorkbenchSubpageBackLinkFromQuery } from "@/components/governance/StewardWorkbenchSubpageBackLinkFromQuery";

function GovernanceProposalsListBackLink({ t }: { t: (key: string) => string }) {
  const searchParams = useSearchParams();
  const href = governanceProposalsListHref(searchParams.get("from"));
  return (
    <Link href={href} className={GOV_PROPOSALS_L5.inlineLink} data-tt-governance-proposals-list-back="1">
      ← {t("governance_proposal_detail_back")}
    </Link>
  );
}

/** 提案 create/detail 子页：主理人回程 + 返回列表（保留 from 查询） */
export function GovernanceProposalsSubpageNav({ t }: { t: (key: string) => string }) {
  return (
    <>
      <Suspense fallback={null}>
        <StewardWorkbenchSubpageBackLinkFromQuery t={t} />
      </Suspense>
      <nav className="mt-4" aria-label={t("governance_nav_label")}>
        <Suspense fallback={null}>
          <GovernanceProposalsListBackLink t={t} />
        </Suspense>
      </nav>
    </>
  );
}
