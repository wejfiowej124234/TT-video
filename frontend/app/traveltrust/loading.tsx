"use client";

import { useTranslation } from "@/components/LocaleProvider";

const shimmer = "animate-traveltrust-shimmer bg-gradient-to-r from-white/5 via-white/12 to-white/5 bg-[length:200%_100%]";

/** v6 cinematic shell skeleton（PH1-UI-35） */
export default function TravelTrustLoading() {
  const { t } = useTranslation();
  return (
    <main
      className="relative z-10 mx-auto max-w-5xl bg-[#0c0a09] px-4 py-6 sm:px-6"
      role="status"
      aria-label={t("traveltrust_title")}
      aria-busy="true"
    >
      <div className={`h-11 w-48 rounded-lg ${shimmer}`} aria-hidden />
      
      <div
        className={`mt-8 min-h-[min(52vh,480px)] rounded-2xl border border-ref-sun/14 ${shimmer}`}
        aria-hidden
      />
      <div className="mt-10 flex gap-2" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`h-12 w-24 rounded-xl ${shimmer}`} />
        ))}
      </div>
      <div
        className={`mt-6 min-h-[min(48vh,400px)] rounded-2xl border border-ref-sun/14 ${shimmer}`}
        aria-hidden
      />
    </main>
  );
}
