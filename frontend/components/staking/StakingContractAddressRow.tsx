"use client";

import { useCallback, useState } from "react";
import { useChainId } from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { FOCUS_RING } from "@/components/me/constants";
import { getExplorerAddressUrl } from "@/lib/staking/stakingBlockExplorer";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";

export function StakingContractAddressRow({
  label,
  address,
}: {
  label: string;
  address: string | null | undefined;
}) {
  const { t } = useTranslation();
  const chainId = useChainId();
  const dash = t("ui_em_dash");
  const [copied, setCopied] = useState(false);
  const display = address?.trim() ? address.trim() : dash;
  const explorerUrl =
    address?.trim() && address.startsWith("0x")
      ? getExplorerAddressUrl(chainId, address)
      : undefined;

  const onCopy = useCallback(async () => {
    if (!address?.trim()) return;
    try {
      await navigator.clipboard.writeText(address.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [address]);

  return (
    <div className={TT_STAKING_PAGE_L5.statRow}>
      <dt className={TT_STAKING_PAGE_L5.statLabel}>{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2">
        <span className={`${TT_STAKING_PAGE_L5.statValue} font-mono text-small break-all`}>{display}</span>
        {address?.trim() ? (
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void onCopy()}
              className={`rounded-lg border border-ref-sun/28 bg-[#0a0a0a]/50 px-2 py-1 text-meta text-slate-300 hover:border-ref-sun/45 hover:text-ref-sun/90 ${FOCUS_RING}`}
              aria-label={copied ? t("me_copiedAnnounce") : t("me_copy")}
            >
              {copied ? t("me_copied") : t("me_copy")}
            </button>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg border border-ref-sun/28 bg-[#0a0a0a]/50 px-2 py-1 text-meta text-ref-sun/75 hover:border-ref-sun/45 hover:text-ref-sun ${FOCUS_RING}`}
              >
                {t("staking_contract_explorer")}
              </a>
            ) : null}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
