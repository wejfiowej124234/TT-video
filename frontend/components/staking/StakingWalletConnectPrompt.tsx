"use client";



import { useEffect, useRef } from "react";

import { useTranslation } from "@/components/LocaleProvider";

import { GUIDE_IDENTITY_STAKE_SECTION_ID } from "@/lib/guide/guideIdentityStakingNav";

import { useAccount } from "wagmi";

import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";



/** 页内钱包提示（体验深壳 · 连接控件仅在顶栏 `WalletStatusMini`，此处不重复按钮） */

export function StakingWalletConnectPrompt({

  messageKey,

  scrollToStakeOnConnect = false,

}: {

  messageKey:

    | "staking_stake_connect"

    | "staking_withdraw_connect"

    | "staking_contract_connectForBalance"

    | "staking_guide_scope_intro";

  /** 向导 scope：连接成功后滚至质押操作区，便于直接缴费 */

  scrollToStakeOnConnect?: boolean;

}) {

  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const wasConnectedRef = useRef(isConnected);



  useEffect(() => {

    const wasConnected = wasConnectedRef.current;

    wasConnectedRef.current = isConnected;

    if (!scrollToStakeOnConnect || wasConnected || !isConnected) return;

    const el = document.getElementById(GUIDE_IDENTITY_STAKE_SECTION_ID);

    el?.scrollIntoView({ behavior: "smooth", block: "start" });

  }, [isConnected, scrollToStakeOnConnect]);



  if (isConnected) return null;



  return (

    <div

      className={TT_STAKING_PAGE_L5.calloutInfo}

      role="note"

      data-tt-staking-wallet-connect-prompt="1"

    >

      <p className="text-body text-slate-300/95">{t(messageKey)}</p>

      <p className="mt-2 text-meta text-slate-400">{t("staking_connect_use_header_wallet")}</p>

      {scrollToStakeOnConnect ? (

        <p className="mt-1 text-meta text-slate-500">{t("staking_guide_scope_connect_hint")}</p>

      ) : null}

    </div>

  );

}

