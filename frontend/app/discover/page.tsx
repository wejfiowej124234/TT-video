"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";

/** 将 /discover 的查询串原样带到 `/market`（与 `middleware` 一致） */
function DiscoverReplaceToMarket() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qs = searchParams?.toString() ?? "";
    router.replace(qs ? `/market?${qs}` : "/market");
  }, [router, searchParams]);
  return null;
}

/** 29 §10：/discover → 自由市场 · 主市场（旅行预约） */
export default function DiscoverRedirect() {
  const { t } = useTranslation();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-8" aria-label={t("discover_page_a11y")}>
      <Suspense fallback={null}>
        <DiscoverReplaceToMarket />
      </Suspense>
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
      <p
        className="relative z-10 text-center text-body text-white/90 motion-sub motion-reduce:transition-none animate-pulse motion-reduce:animate-none drop-shadow-on-dark"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {t("discover_redirect")}
      </p>
    </main>
  );
}
