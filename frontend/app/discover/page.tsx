"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";

/** 将 /discover 的查询串原样带到 /market，与 useMarketPage URL 同步逻辑一致 */
function DiscoverReplaceToMarket() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/market?${qs}` : "/market");
  }, [router, searchParams]);
  return null;
}

/** 29 §10：/discover 与 /market 统一为同一页，重定向到自由市场（撮合控制台） */
export default function DiscoverRedirect() {
  const { t } = useTranslation();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-8" aria-label={t("discover_page_a11y")}>
      <Suspense fallback={null}>
        <DiscoverReplaceToMarket />
      </Suspense>
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
      <p className="relative z-10 text-slate-300 motion-sub animate-pulse drop-shadow-on-dark">{t("discover_redirect")}</p>
    </main>
  );
}
