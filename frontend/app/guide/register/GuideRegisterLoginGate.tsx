"use client";

import Link from "next/link";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { guideRegFocusRing, guideRegPrimaryCta } from "./guideRegisterUiClasses";

const DEFAULT_TITLE_KEY = "guideRegister_loginGateTitle";
const DEFAULT_BODY_KEY = "guideRegister_loginGateBody";
const DEFAULT_WALLET_HINT_KEY = "registerFlow_walletSessionHint";

/** Auth L5 · 入驻/申请流登录门闸（guide · steward · provider 共用壳，文案由调用方传入 key） */
export default function GuideRegisterLoginGate({
  t,
  loginHref,
  titleKey = DEFAULT_TITLE_KEY,
  bodyKey = DEFAULT_BODY_KEY,
  walletHintKey = DEFAULT_WALLET_HINT_KEY,
  showWalletHint = true,
}: {
  t: (key: string) => string;
  loginHref: string;
  titleKey?: string;
  bodyKey?: string;
  walletHintKey?: string;
  showWalletHint?: boolean;
}) {
  return (
    <div
      className="auth-l5-callout-surface mb-4 rounded-xl border border-ref-sun/22 bg-ref-sun/[0.07] px-4 py-3"
      role="status"
      data-tt-register-flow-login-gate="1"
    >
      <p className="text-small font-semibold text-slate-100">{t(titleKey)}</p>
      <p className="mt-1 text-meta leading-relaxed text-slate-300/95">{t(bodyKey)}</p>
      {showWalletHint ? (
        <p className="mt-2 text-meta leading-relaxed text-slate-400/95">{t(walletHintKey)}</p>
      ) : null}
      <Link
        href={loginHref}
        className={`${touchTargetLink44Classes} mt-3 inline-flex min-h-[44px] w-full items-center justify-center sm:w-auto ${guideRegPrimaryCta} px-5 ${guideRegFocusRing}`}
      >
        {t("header_login")}
      </Link>
    </div>
  );
}
