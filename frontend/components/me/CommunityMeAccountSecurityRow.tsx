"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { FOCUS_RING } from "@/components/me/constants";
import { runMeLogoutFlow } from "@/lib/meLogoutFlow";

/** 社区「我的」：改密 / 退出；置于「身份与验证」下方，与 `useMePage` 登出同源 */
export default function CommunityMeAccountSecurityRow() {
  const { t } = useTranslation();
  return (
    <div
      id="me-account-security"
      className="scroll-mt-24 rounded-[var(--radius-md)] border border-cyan-400/35 bg-slate-900/60 backdrop-blur-md shadow-scifi-banner px-3 py-3 sm:px-4 ring-1 ring-white/5 flex flex-wrap items-center gap-2 sm:gap-3"
    >
      <Link
        href="/me/password"
        className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
      >
        {t("me_changePassword")}
      </Link>
      <form
        className="inline"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          runMeLogoutFlow(t);
        }}
      >
        <button
          type="submit"
          className={`inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2.5 min-h-[44px] text-meta text-slate-300 hover:bg-slate-700/60 hover:text-slate-200 motion-sub ${FOCUS_RING}`}
        >
          {t("me_logout")}
        </button>
      </form>
    </div>
  );
}
