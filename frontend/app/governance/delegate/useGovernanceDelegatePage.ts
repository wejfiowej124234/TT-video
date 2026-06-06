// search-params gate: parent route provides Suspense boundary.
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import {
  deleteGovernanceDelegate,
  getGovernanceDelegate,
  postGovernanceDelegate,
  type GovernanceDelegateWriteResponse,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapOrderWriteError } from "@/lib/mapOrderWriteError";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { hasClientSession } from "./governanceDelegatePageModel";

export function useGovernanceDelegatePage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const fetchDelegate = useCallback(
    (silent: boolean) => {
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
    },
    [t],
  );

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

  const copyLine = useCallback(
    async (label: string, value: string) => {
      setCopyHint(null);
      try {
        await navigator.clipboard.writeText(value);
        setCopyHint(`${label}${t("market_fin_colon")}${t("agree_copy_done")}`);
      } catch {
        setCopyHint(t("agree_copy_failed"));
      }
      setTimeout(() => setCopyHint(null), 4000);
    },
    [t],
  );

  const onSubmitDelegate = useCallback(
    async (e: FormEvent) => {
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
    },
    [actionBusy, fetchDelegate, t, targetDraft],
  );

  const onRevoke = useCallback(async () => {
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
  }, [actionBusy, fetchDelegate, t]);

  const hasSession = hasClientSession();

  return {
    t,
    loading,
    error,
    setRetryTick,
    authenticated,
    delegateTo,
    targetDraft,
    setTargetDraft,
    actionBusy,
    actionError,
    copyHint,
    receipt,
    loginHref,
    hasSession,
    copyLine,
    onSubmitDelegate,
    onRevoke,
  };
}
