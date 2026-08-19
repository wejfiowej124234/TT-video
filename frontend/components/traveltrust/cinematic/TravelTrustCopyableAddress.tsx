"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TT_ECONOMY_INTERACT_L5 } from "@/lib/traveltrust/l5";

type Props = {
  label: string;
  address: string;
  explorerUrl: string | null;
  field: "ttg" | "pm";
};

/** 结算区：完整地址 + 复制 + 浏览器（不缩短到不可核验） */
export function TravelTrustCopyableAddress({ label, address, explorerUrl, field }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      trackTravelTrustEvent("traveltrust_secondary_cta_click", {
        source: "settlement_copy_address",
        target: field,
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-w-0" data-tt-traveltrust-settlement-address={field}>
      <dt className="text-slate-400/90">{label}</dt>
      <dd className="mt-1.5 flex min-w-0 flex-col gap-2">
        <code className="break-all text-[12px] leading-snug text-slate-100/95">{address}</code>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#f4d39a]/40 px-3 text-meta font-semibold text-[#f4d39a] transition hover:bg-[#f4d39a]/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d39a]/45"
            data-tt-traveltrust-settlement-copy={field}
            onClick={() => void copyAddress()}
            whileHover={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaHover}
            whileTap={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaTap}
            transition={TT_ECONOMY_INTERACT_L5.transition}
          >
            {copied ? t("traveltrust_settlement_copied") : t("traveltrust_settlement_copy")}
          </motion.button>
          {explorerUrl ? (
            <motion.a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-meta font-medium text-ref-sun/90 underline-offset-2 hover:underline"
              whileHover={reduceMotion ? undefined : TT_ECONOMY_INTERACT_L5.ctaHover}
              transition={TT_ECONOMY_INTERACT_L5.transition}
            >
              {t("traveltrust_settlement_open_explorer")} →
            </motion.a>
          ) : null}
        </div>
      </dd>
    </div>
  );
}
