"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { getMeStewardApplication } from "@/lib/apiClient";
import { parseStewardApplicationStakeView } from "@/lib/steward/parseStewardApplicationView";
import { getRegionStewardStakePoolAddress } from "@/lib/steward/stewardStakeEnv";
import { StewardStakeJurisdictionRow } from "@/components/steward/StewardStakeJurisdictionRow";
import { ME_ONBOARDING_SECTION_CARD_CLASS } from "./meOnboardingPageChrome";
import type { UseMeOnboardingPageResult } from "./useMeOnboardingPage";

type T = UseMeOnboardingPageResult["t"];

export function MeOnboardingStewardStakeSection({ t }: { t: T }) {
  const sectionId = useId();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [app, setApp] = useState<ReturnType<typeof parseStewardApplicationStakeView>>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const raw = await getMeStewardApplication();
      setApp(parseStewardApplicationStakeView(raw));
    } catch {
      setErr(t("stewardStake_loadFailed"));
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const pool = getRegionStewardStakePoolAddress();

  return (
    <section
      className={ME_ONBOARDING_SECTION_CARD_CLASS}
      aria-labelledby={sectionId}
      data-tt-me-onboarding-steward-stake="1"
    >
      <h2 id={sectionId} className="text-h4 font-semibold text-ink-900">
        {t("me_onboarding_stewardStakeSection")}
      </h2>
      <p className="mt-2 text-meta leading-relaxed text-ink-600">{t("me_onboarding_stewardStakeHint")}</p>

      {!pool ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {t("stewardStake_poolMissing")}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 text-meta text-ink-500" aria-busy="true">
          {t("me_onboarding_loading")}
        </p>
      ) : err ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {err}
        </p>
      ) : !app ? (
        <p className="mt-3 text-meta text-ink-600">{t("me_onboarding_stewardStakeNoApplication")}</p>
      ) : (
        <>
          <p className="mt-2 font-mono text-meta text-ink-500 break-all">
            {t("steward_register_wallet")}: {app.walletAddress}
          </p>
          <ul className="mt-4 space-y-3" data-tt-steward-onboarding-stake-list="1">
            {app.jurisdictions.map((jid) => (
              <StewardStakeJurisdictionRow
                key={jid}
                jurisdictionId={jid}
                applicationId={app.id}
                expectedWallet={app.walletAddress}
                onStaked={() => setRefreshKey((k) => k + 1)}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
