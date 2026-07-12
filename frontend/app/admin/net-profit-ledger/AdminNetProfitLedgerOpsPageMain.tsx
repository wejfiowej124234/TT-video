"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { OpsPlaneFetchStates } from "@/components/admin/ops/OpsPlaneFetchStates";
import {
  OfficialOpsDataTable,
  OfficialOpsTableBody,
  OfficialOpsTableHead,
  OfficialOpsTableTh,
} from "@/components/admin/ops/OfficialOpsDataTable";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_TABLE_TD_CELL_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { requestId, writeRequestHeaders } from "@/lib/apiClient/core";
import { formatNetProfitUsdcAtomic } from "@/lib/governance/netProfitLedgerTransparencyModel";

type NetProfitOpsResponse = {
  status?: string;
  protocolVersion?: string;
  splitRatio?: string;
  readOnly?: boolean;
  accountingAudit?: { status?: string; netProfitSplitFailures?: number };
  indexerHealth?: {
    epochCount?: number;
    eventCount?: number;
    lastIndexedBlock?: number;
  };
  jurisdictions?: Array<{
    jurisdiction: string;
    indexed?: boolean;
    epochs?: Array<{
      epochId?: string;
      status?: string;
      netProfitPrime?: string;
      stewardAmount?: string;
      globalAmount?: string;
    }>;
  }>;
  events?: Array<{
    event?: string;
    jurisdiction?: string;
    epochId?: string;
    blockNumber?: number;
    txHash?: string;
    accountingOk?: boolean | null;
  }>;
  note?: string;
};

function adminHeaders() {
  return { ...writeRequestHeaders(), "x-request-id": requestId() };
}

export default function AdminNetProfitLedgerOpsPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const [data, setData] = useState<NetProfitOpsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const res = await fetch(apiUrl(`${routes.adminNetProfitLedgerOps}?events_limit=100`), {
        headers: adminHeaders(),
        credentials: "include",
      });
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);
      setData((await res.json()) as NetProfitOpsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminDetailPageChrome
      requiredPermission={ADMIN_PERM.FINANCE_READ}
      titleId={titleId}
      title={t("admin_net_profit_ledger_ops_title")}
      kicker={t("admin_net_profit_ledger_ops_kicker")}
    >
      {denied && <AdminPermissionDeniedBanner permission={ADMIN_PERM.FINANCE_READ} />}
      <AdminWarmL5Surface>
        <OpsPlaneFetchStates loading={loading} error={error} onRetry={load} />
        {!loading && data && (
          <>
            <p className="text-small text-ink-600">{t("admin_net_profit_ledger_ops_desc")}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-small">
              <div>
                <dt className="text-meta text-ink-500">{t("admin_net_profit_ledger_ops_accounting")}</dt>
                <dd className="font-mono">{data.accountingAudit?.status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("admin_net_profit_ledger_ops_events")}</dt>
                <dd className="font-mono">{data.indexerHealth?.eventCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-meta text-ink-500">{t("admin_net_profit_ledger_ops_epochs")}</dt>
                <dd className="font-mono">{data.indexerHealth?.epochCount ?? 0}</dd>
              </div>
            </dl>
            <OfficialOpsDataTable className="mt-6" dataAttr="net-profit-ledger-events">
              <OfficialOpsTableHead>
                <tr>
                  <OfficialOpsTableTh>{t("admin_net_profit_ledger_ops_col_event")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_net_profit_ledger_ops_col_jurisdiction")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_net_profit_ledger_ops_col_epoch")}</OfficialOpsTableTh>
                  <OfficialOpsTableTh>{t("admin_net_profit_ledger_ops_col_block")}</OfficialOpsTableTh>
                </tr>
              </OfficialOpsTableHead>
              <OfficialOpsTableBody>
                {(data.events ?? []).map((ev, i) => (
                  <tr key={`${ev.blockNumber}-${i}`}>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{ev.event}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{ev.jurisdiction}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{ev.epochId ?? "—"}</td>
                    <td className={ADMIN_TABLE_TD_CELL_CLASS}>{ev.blockNumber}</td>
                  </tr>
                ))}
              </OfficialOpsTableBody>
            </OfficialOpsDataTable>
            <Link href="/governance/net-profit-ledger" className={`mt-6 inline-block ${adminPageNavLinkClass}`}>
              {t("admin_net_profit_ledger_ops_public_link")}
            </Link>
          </>
        )}
      </AdminWarmL5Surface>
    </AdminDetailPageChrome>
  );
}
