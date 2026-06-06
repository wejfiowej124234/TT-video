"use client";

import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import {
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  deleteGovernanceDelegate,
  getGovernanceDelegate,
  postGovernanceDelegate,
  type GovernanceDelegateWriteResponse,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapOrderWriteError } from "@/lib/mapOrderWriteError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import { GovernanceOpsAdminLinks } from "@/components/governance/GovernanceOpsAdminLinks";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { GovernanceSearchParamsRouteSuspense } from "@/components/governance/GovernanceSearchParamsRouteSuspense";

function hasClientSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim() ||
    localStorage.getItem(AUTH_USER_ID_KEY)?.trim()
  );
}

/** B-073：委托 / 撤销 + 回执（request_id / tx_hash） */
function GovernanceDelegatePageInner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageTitleId = useId();
  const formId = useId();
  const targetInputId = useId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [delegateTo, setDelegateTo] = useState<string | null>(null);
  const [targetDraft, setTargetDraft] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<
    (GovernanceDelegateWriteResponse & { action: "post" | "delete" }) | null
  >(null);

  const loginHref = useMemo(() => {
    const next = buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", "/governance/delegate");
    return `/auth/login?returnUrl=${encodeURIComponent(next)}`;
  }, [pathname, searchParams]);

  const fetchDelegate = useCallback((silent: boolean) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    getGovernanceDelegate()
      .then((j) => {
        setAuthenticated(j.authenticated === true);
        const d = j.delegate_to;
        setDelegateTo(typeof d === "string" && d.trim() ? d.trim() : null);
        setError(null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("GovernanceDelegatePage getGovernanceDelegate:", err);
        }
        if (!silent) {
          setDelegateTo(null);
          setAuthenticated(false);
          setError(mapApiReadError(err, t, "governance_delegate_loadFailed"));
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [t]);

  useEffect(() => {
    fetchDelegate(false);
  }, [fetchDelegate, retryTick]);

  useEffect(() => {
    const onAuth = () => {
      setRetryTick((n) => n + 1);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("traveltrust:auth-change", onAuth);
      return () => window.removeEventListener("traveltrust:auth-change", onAuth);
    }
    return undefined;
  }, []);

  async function copyLine(label: string, value: string) {
    setCopyHint(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopyHint(`${label}${t("market_fin_colon")}${t("agree_copy_done")}`);
    } catch {
      setCopyHint(t("agree_copy_failed"));
    }
    setTimeout(() => setCopyHint(null), 4000);
  }

  async function onSubmitDelegate(e: FormEvent) {
    e.preventDefault();
    if (actionBusy || !hasClientSession()) return;
    setActionBusy(true);
    setActionError(null);
    setReceipt(null);
    try {
      const res = await postGovernanceDelegate(targetDraft);
      setReceipt({ ...res, action: "post" });
      setTargetDraft("");
      fetchDelegate(true);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("GovernanceDelegatePage postGovernanceDelegate:", err);
      }
      setActionError(mapOrderWriteError(err, t, { fallbackKey: "governance_delegate_loadFailed" }));
    } finally {
      setActionBusy(false);
    }
  }

  async function onRevoke() {
    if (actionBusy || !hasClientSession()) return;
    setActionBusy(true);
    setActionError(null);
    setReceipt(null);
    try {
      const res = await deleteGovernanceDelegate();
      setReceipt({ ...res, action: "delete" });
      fetchDelegate(true);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("GovernanceDelegatePage deleteGovernanceDelegate:", err);
      }
      setActionError(mapOrderWriteError(err, t, { fallbackKey: "governance_delegate_loadFailed" }));
    } finally {
      setActionBusy(false);
    }
  }

  const hasSession = hasClientSession();
  const btnClass = `min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`;

  return (
    <main className="mx-auto max-w-3xl p-8" aria-labelledby={pageTitleId} data-tt-governance-delegate-page="1">
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_delegate_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_delegate_intro")}</p>
      <GovernanceTargetNotice className="mt-4" />

      {loading ? (
        <div className="mt-6">
          <LoadingText />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 space-y-2">
          <ApiErrorAlert message={error} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loading) return;
              setRetryTick((n) => n + 1);
            }}
          >
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`}
            >
              {loading ? t("common_retrying") : t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="mt-6 space-y-4" aria-label={t("governance_delegate_current")}>
          <div>
            <h2 className="text-small font-semibold text-ink-800">{t("governance_delegate_current")}</h2>
            <p className="mt-1 font-mono text-body text-ink-900">
              {authenticated && delegateTo ? delegateTo : t("governance_delegate_none")}
            </p>
          </div>

          {!hasSession ? (
            <div className="rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/50 p-4 dark:border-ink-600/40 dark:bg-ink-900/20">
              <p className="text-body text-ink-700 dark:text-ink-200">{t("governance_delegate_login_hint")}</p>
              <Link
                href={loginHref}
                className={`${touchTargetLink44Classes} mt-2 inline-flex items-center font-medium text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
              >
                {t("governance_delegate_go_login")}
              </Link>
            </div>
          ) : null}

          {hasSession ? (
            <form id={formId} className="space-y-3" onSubmit={onSubmitDelegate}>
              <div>
                <label htmlFor={targetInputId} className="text-small font-medium text-ink-800">
                  {t("governance_delegate_target_label")}
                </label>
                <input
                  id={targetInputId}
                  type="text"
                  name="delegate_to"
                  autoComplete="off"
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  placeholder={t("governance_delegate_target_placeholder")}
                  className={`mt-1 w-full max-w-xl min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={btnClass} disabled={actionBusy || !targetDraft.trim()}>
                  {t("governance_delegate_submit")}
                </button>
                <button
                  type="button"
                  className={btnClass}
                  disabled={actionBusy || !delegateTo}
                  onClick={() => void onRevoke()}
                >
                  {t("governance_delegate_revoke")}
                </button>
              </div>
            </form>
          ) : null}

          {actionError ? (
            <div className="mt-2">
              <ApiErrorAlert message={actionError} />
            </div>
          ) : null}

          {receipt?.request_id ? (
            <div
              className="rounded-[var(--radius-md)] border border-ink-200/80 bg-white p-4 dark:border-ink-600/40 dark:bg-ink-900/30"
              aria-label={t("governance_delegate_receipt_title")}
            >
              <h2 className="text-small font-semibold text-ink-800">{t("governance_delegate_receipt_title")}</h2>
              <dl className="mt-3 space-y-2 text-body text-ink-800">
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="font-medium">{t("governance_delegate_receipt_request_id")}</dt>
                  <dd className="font-mono text-small break-all">{receipt.request_id}</dd>
                  <button
                    type="button"
                    className={`${touchTargetLink44Classes} text-travel-600 text-small hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                    onClick={() => void copyLine("request_id", receipt.request_id ?? "")}
                  >
                    {t("agree_copy")}
                  </button>
                </div>
                <div>
                  <dt className="font-medium">{t("governance_delegate_receipt_tx_hash")}</dt>
                  <dd className="mt-1 font-mono text-small text-ink-600">
                    {receipt.tx_hash && String(receipt.tx_hash).trim()
                      ? String(receipt.tx_hash)
                      : t("governance_delegate_receipt_tx_none")}
                  </dd>
                </div>
              </dl>
              {receipt.action === "post" && receipt.idempotent ? (
                <p className="mt-3 text-meta text-ink-600" role="status">
                  {t("governance_delegate_receipt_idempotent")}
                </p>
              ) : null}
            </div>
          ) : null}
          {copyHint ? (
            <p className="text-meta text-ink-600" role="status">
              {copyHint}
            </p>
          ) : null}
        </section>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_title")}
        </Link>
        <Link
          href="/governance/proposals"
          className={`inline-flex min-h-[44px] items-center justify-start text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposals_title")}
        </Link>
        <GovernanceOpsAdminLinks />
      </nav>
      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}

export default function GovernanceDelegatePage() {
  return (
    <GovernanceSearchParamsRouteSuspense pageTitleKey="governance_delegate_title" introKey="governance_delegate_intro">
      <GovernanceDelegatePageInner />
    </GovernanceSearchParamsRouteSuspense>
  );
}
