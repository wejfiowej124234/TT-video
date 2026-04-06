"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import MePageBackground from "@/components/me/MePageBackground";
import MePageSkeleton from "@/components/me/MePageSkeleton";
import MeStatsSection from "@/components/me/MeStatsSection";
import MeProfileSection from "@/components/me/MeProfileSection";
import MeQuickLinksSection from "@/components/me/MeQuickLinksSection";
import MePageFooter from "@/components/me/MePageFooter";
import MeTrustSection from "@/components/me/MeTrustSection";
import { useMePage } from "@/components/me/useMePage";
import { FOCUS_RING, type UserShape } from "@/components/me/constants";
import { parseMeTrustFromMeResponse } from "@/lib/meTrust";
import { userIsGuide } from "@/lib/meRoleDisplay";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** stats 中键缺失视为 0（与现网一致）；键存在但非有限数则展示为 em dash，避免 NaN / 非法值误显示为 0。 */
function mePageStatNumber(stats: unknown, key: string): number | null {
  if (!stats || typeof stats !== "object") return 0;
  const o = stats as Record<string, unknown>;
  if (!(key in o)) return 0;
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

export default function MePage() {
  const { t } = useTranslation();
  const hook = useMePage(t);

  if (hook.loading) return <MePageSkeleton t={t} />;

  if (hook.error) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-slate-950" aria-label={t("me_title")}>
        <MePageBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
          <div className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-800/50 px-4 py-4 space-y-4">
            <h1 className="sr-only">{t("me_title")}</h1>
            <ApiErrorAlert message={hook.error} />
            <div className="flex flex-wrap gap-3">
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  hook.loadMe();
                }}
              >
                <button
                  type="submit"
                  className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${FOCUS_RING}`}
                >
                  {t("common_retry")}
                </button>
              </form>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-500/60 bg-slate-800/60 px-4 py-2.5 min-h-[44px] text-meta text-slate-300 hover:bg-slate-700/60 motion-sub"
              >
                {t("me_goLogin")}
              </Link>
            </div>
            <ProductCrossNav
              ariaLabelKey="me_relatedNav_aria"
              showGuides
              className="pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-slate-300"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 font-medium motion-sub ${FOCUS_RING}`}
              separatorClassName="text-slate-500"
            />
          </div>
        </div>
      </main>
    );
  }

  const user = (hook.data as { user?: UserShape })?.user;
  const ordersTotal = mePageStatNumber(hook.stats, "orders_total");
  const reviewsCount = mePageStatNumber(hook.stats, "reviews_count");
  const totalSpent = mePageStatNumber(hook.stats, "total_spent");

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950" aria-label={t("me_title")}>
      <MePageBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <header
          className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6 shadow-scifi-banner-strong motion-sub hover:border-cyan-400/60 hover:shadow-scifi-hover-strong"
        >
          <h1 className="text-h2 font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            {t("me_title")}
          </h1>
          <p className="text-small text-slate-300 mt-0.5">{t("me_subtitle")}</p>
        </header>

        {user && (
          <>
            <MeTrustSection
              t={t}
              trust={parseMeTrustFromMeResponse(hook.data, user)}
              showGuideRegisterLink={!userIsGuide(user)}
            />
            <MeStatsSection
              t={t}
              statsLoading={hook.statsLoading}
              statsError={hook.statsError}
              loadStats={hook.loadStats}
              ordersTotal={ordersTotal}
              reviewsCount={reviewsCount}
              totalSpent={totalSpent}
            />
            <MeProfileSection
              t={t}
              user={user}
              editing={hook.editing}
              setEditing={hook.setEditing}
              editForm={hook.editForm}
              setEditForm={hook.setEditForm}
              submitError={hook.submitError}
              submitting={hook.submitting}
              avatarError={hook.avatarError}
              setAvatarError={hook.setAvatarError}
              copiedField={hook.copiedField}
              copyClipboardBusy={hook.copyClipboardBusy}
              copyToClipboard={hook.copyToClipboard}
              connectedAddress={hook.connectedAddress}
              syncingWallet={hook.syncingWallet}
              editButtonRef={hook.editButtonRef}
              handleSubmit={hook.handleSubmit}
              handleSyncWallet={hook.handleSyncWallet}
            />
            <MeQuickLinksSection t={t} showGuideHub={user.role === "guide"} />
            <div className="flex flex-wrap gap-3 mb-6">
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
                  hook.handleLogout();
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
          </>
        )}

        <MePageFooter t={t} />
      </div>
    </main>
  );
}
