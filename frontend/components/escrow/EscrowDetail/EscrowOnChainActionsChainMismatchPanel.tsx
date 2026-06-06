"use client";

import EscrowChainMismatchActions from "./EscrowChainMismatchActions";
import type { LocaleInterpolationVars } from "@/lib/i18n";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function EscrowOnChainActionsChainMismatchPanel({
  isConnected,
  expectedChainId,
  chainId,
  isDid,
  t,
}: {
  isConnected: boolean;
  expectedChainId: number;
  chainId: number;
  isDid: boolean;
  t: TFn;
}) {
  return (
    <div className="space-y-1">
      <p className="text-small text-warning" role="alert">
        {t("escrow_wrongChainDesc")
          .replace("{expectedChainId}", String(expectedChainId))
          .replace("{chainId}", String(chainId))}
      </p>
      <EscrowChainMismatchActions isConnected={isConnected} expectedChainId={expectedChainId} chainId={chainId} variantDid={isDid} />
    </div>
  );
}
