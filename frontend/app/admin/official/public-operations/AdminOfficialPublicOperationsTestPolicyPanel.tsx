"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminOpsRiskBanner } from "@/components/admin/ops/AdminOpsRiskBanner";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import { adminConfirmOfficialPublish } from "@/lib/admin/adminOpsWriteConfirm";
import {
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";
import {
  getAdminOfficialPublicOperationsPolicy,
  patchAdminOfficialPublicOperationsPolicy,
  type AdminPublicOpsPolicy,
} from "@/lib/apiClient";

const BLOCKED_ORIGIN_OPTIONS = ["REAL", "OFFICIAL", "SHOWCASE", "TEST", "SMOKE", "SYSTEM"] as const;

export function AdminOfficialPublicOperationsTestPolicyPanel() {
  const { t } = useTranslation();
  const titleId = useId();
  const requestConfirm = useAdminL5ConfirmRequest();
  const [policy, setPolicy] = useState<AdminPublicOpsPolicy | null>(null);
  const [draftBlocked, setDraftBlocked] = useState<string[]>([]);
  const [draftShowTest, setDraftShowTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOfficialPublicOperationsPolicy();
      if (res.status === "ok" && res.policy) {
        setPolicy(res.policy);
        setDraftBlocked(res.policy.blocked_origins ?? []);
        setDraftShowTest(Boolean(res.policy.show_test_data));
      } else {
        setError("admin_public_operations_policy_load_failed");
      }
    } catch {
      setError("admin_public_operations_policy_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function toggleBlocked(origin: string) {
    setDraftBlocked((prev) =>
      prev.includes(origin) ? prev.filter((o) => o !== origin) : [...prev, origin].sort(),
    );
  }

  async function savePolicy() {
    setSaveError(null);
    const ok = await adminConfirmOfficialPublish(requestConfirm, t);
    if (!ok) return;
    setBusy(true);
    try {
      const res = await patchAdminOfficialPublicOperationsPolicy({
        show_test_data: draftShowTest,
        blocked_origins: draftBlocked,
      });
      if (res.status === "ok" && res.policy) {
        setPolicy(res.policy);
        setDraftBlocked(res.policy.blocked_origins ?? []);
        setDraftShowTest(Boolean(res.policy.show_test_data));
      } else {
        setSaveError("admin_public_operations_policy_save_failed");
      }
    } catch {
      setSaveError("admin_public_operations_policy_save_failed");
    } finally {
      setBusy(false);
    }
  }

  const dirty =
    policy != null &&
    (draftShowTest !== Boolean(policy.show_test_data) ||
      JSON.stringify([...draftBlocked].sort()) !==
        JSON.stringify([...(policy.blocked_origins ?? [])].sort()));

  return (
    <section aria-labelledby={titleId} data-tt-admin-public-operations-test-policy="1">
      <h2 id={titleId} className="sr-only">
        {t("admin_public_operations_tab_test_policy")}
      </h2>
      <AdminOpsRiskBanner messageKey="admin_public_operations_policy_risk_banner" variant="warning" />
      <OpsPlaneFetchStates loading={loading} error={error} onRetry={() => void reload()}>
        <div className="max-w-xl space-y-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={draftShowTest}
              onChange={(e) => setDraftShowTest(e.target.checked)}
              disabled={busy}
            />
            <span>
              <span className="block text-body font-medium text-ink-900">
                {t("admin_public_operations_policy_show_test_data")}
              </span>
              <span className="block text-small text-ink-500">
                {t("admin_public_operations_policy_show_test_data_hint")}
              </span>
            </span>
          </label>
          <fieldset>
            <legend className={`${ADMIN_FILTER_FIELD_LABEL_CLASS} mb-2`}>
              {t("admin_public_operations_policy_blocked_origins")}
            </legend>
            <div className="flex flex-wrap gap-3">
              {BLOCKED_ORIGIN_OPTIONS.map((origin) => (
                <label key={origin} className="flex items-center gap-2 text-small text-ink-800">
                  <input
                    type="checkbox"
                    checked={draftBlocked.includes(origin)}
                    onChange={() => toggleBlocked(origin)}
                    disabled={busy}
                  />
                  {origin}
                </label>
              ))}
            </div>
            <p className="mt-2 text-small text-ink-500">{t("admin_public_operations_policy_blocked_origins_hint")}</p>
          </fieldset>
          {policy?.updated_at ? (
            <p className="font-mono text-meta text-ink-500">
              {t("admin_public_operations_policy_updated_at")}: {new Date(policy.updated_at).toLocaleString()}
            </p>
          ) : null}
          {saveError ? <p className="text-small text-red-700">{t(saveError)}</p> : null}
          <button
            type="button"
            className={adminTableRowPrimaryActionClass()}
            disabled={busy || !dirty}
            onClick={() => void savePolicy()}
          >
            {t("admin_public_operations_policy_save")}
          </button>
        </div>
      </OpsPlaneFetchStates>
    </section>
  );
}
