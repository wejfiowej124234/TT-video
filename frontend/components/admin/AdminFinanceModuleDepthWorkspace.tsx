"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { AdminFinanceAuditDepthPanel } from "@/components/admin/AdminFinanceAuditDepthPanel";
import { AdminFinanceCrossCheckDepthPanel } from "@/components/admin/AdminFinanceCrossCheckDepthPanel";
import { AdminFinanceDriftDepthPanel } from "@/components/admin/AdminFinanceDriftDepthPanel";
import { AdminFinanceExportDepthPanel } from "@/components/admin/AdminFinanceExportDepthPanel";
import { AdminFinanceFeeRouterDepthPanel } from "@/components/admin/AdminFinanceFeeRouterDepthPanel";
import { AdminFinanceIndexerDepthPanel } from "@/components/admin/AdminFinanceIndexerDepthPanel";
import { AdminFinanceAlertIncidentsDepthPanel } from "@/components/admin/AdminFinanceAlertIncidentsDepthPanel";
import { AdminFinanceObservabilityDepthPanel } from "@/components/admin/AdminFinanceObservabilityDepthPanel";
import { AdminFinanceTrustGrowthDepthPanel } from "@/components/admin/AdminFinanceTrustGrowthDepthPanel";
import { AdminFinanceReconcileReportsDepthPanel } from "@/components/admin/AdminFinanceReconcileReportsDepthPanel";
import { AdminFinanceRegionVaultDepthPanel } from "@/components/admin/AdminFinanceRegionVaultDepthPanel";
import { AdminFinanceReconciliationDepthPanel } from "@/components/admin/AdminFinanceReconciliationDepthPanel";
import { AdminFinanceRefundsDepthPanel } from "@/components/admin/AdminFinanceRefundsDepthPanel";
import { AdminFinanceDepthModuleFallback } from "@/components/admin/AdminFinanceDepthModuleFallback";
import { AdminFinanceSettlementDepthPanel } from "@/components/admin/AdminFinanceSettlementDepthPanel";

type SettlementProps = {
  summary: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  loading: boolean;
};

type RefundsProps = {
  items: { id: string; status: string; order_id?: string }[];
  loading: boolean;
  error: boolean;
};

type ExportProps = {
  exporting: boolean;
  onExport: () => void;
  meta: Record<string, unknown> | null;
};

type ReconciliationProps = {
  alignmentLabel: string | null;
  driftDeltaLine: string;
  crossDeltaLine: string;
  loading: boolean;
  error: boolean;
};

type CrossCheckProps = {
  status: string | null;
  slotCount: number;
  loading: boolean;
  error: boolean;
};

type FeeRouterProps = {
  total: number | null;
  minBlock: number | null;
  maxBlock: number | null;
  latestInserted: string | null;
  loading: boolean;
  error: boolean;
};

type AuditProps = {
  entryCount: number;
  latestAction: string | null;
  latestActor: string | null;
  loading: boolean;
  error: boolean;
};

type DriftProps = {
  driftDetected: boolean | null;
  status: string | null;
  loading: boolean;
  error: boolean;
};

type RegionVaultProps = {
  total: number | null;
  minBlock: number | null;
  maxBlock: number | null;
  latestInserted: string | null;
  loading: boolean;
  error: boolean;
};

type IndexerProps = {
  checkpointBlock: number | null;
  checkpointLog: number | null;
  lagBlocks: number | null;
  reorgDetected: boolean | null;
  replayRequired: boolean | null;
  loading: boolean;
  error: boolean;
};

type ReconcileReportsProps = {
  total: number;
  page: number;
  limit: number;
  reportType: string | null;
  hasActiveFilters: boolean;
  loading: boolean;
  error: boolean;
};

type ObservabilityProps = {
  chainId: string | null;
  indexerLag: number | null;
  status: string | null;
  loading: boolean;
  error: boolean;
};

type TrustGrowthProps = {
  environment: string | null;
  autopilotGeneration: number | null;
  alertsCount: number;
  weightsFrozen: boolean | null;
  loading: boolean;
  error: boolean;
};

type AlertIncidentsProps = {
  syncedIncidentId: string | null;
  hasSyncedIncident: boolean;
  loading: boolean;
  error: boolean;
};

/** FIN-02 · ① 七件套 partial 页内深度工作台（② 结算/PSP 闭环另闸）。 */
export function AdminFinanceModuleDepthWorkspace(props: {
  settlement?: SettlementProps;
  refunds?: RefundsProps;
  exportPanel?: ExportProps;
  reconciliation?: ReconciliationProps;
  crossCheck?: CrossCheckProps;
  feeRouter?: FeeRouterProps;
  audit?: AuditProps;
  drift?: DriftProps;
  regionVault?: RegionVaultProps;
  indexer?: IndexerProps;
  reconcileReports?: ReconcileReportsProps;
  observability?: ObservabilityProps;
  trustGrowth?: TrustGrowthProps;
  alertIncidents?: AlertIncidentsProps;
}) {
  const moduleId = useSearchParams().get("fin_suite_module") ?? "";
  const depth = useSearchParams().get("fin_suite_depth");
  if (depth !== "partial") return null;

  const wrap = (id: string, node: ReactNode) => (
    <div data-tt-admin-fin-depth-workspace="1" data-tt-admin-fin-depth-module={id}>
      {node}
    </div>
  );

  const hasModuleProps =
    (moduleId === "finance-summary" && props.settlement) ||
    (moduleId === "refunds" && props.refunds) ||
    (moduleId === "export" && props.exportPanel) ||
    (moduleId === "reconciliation" && props.reconciliation) ||
    (moduleId === "cross-check" && props.crossCheck) ||
    (moduleId === "fee-router" && props.feeRouter) ||
    (moduleId === "audit" && props.audit) ||
    (moduleId === "drift" && props.drift) ||
    (moduleId === "region-vault" && props.regionVault) ||
    (moduleId === "indexer" && props.indexer) ||
    (moduleId === "reconcile-reports" && props.reconcileReports) ||
    (moduleId === "observability" && props.observability) ||
    (moduleId === "trust-growth" && props.trustGrowth) ||
    (moduleId === "alert-incidents" && props.alertIncidents);

  if (moduleId && !hasModuleProps) {
    return wrap(moduleId, <AdminFinanceDepthModuleFallback />);
  }

  if (moduleId === "finance-summary" && props.settlement) {
    return wrap(
      moduleId,
      <AdminFinanceSettlementDepthPanel
        summary={props.settlement.summary}
        meta={props.settlement.meta}
        loading={props.settlement.loading}
      />
    );
  }
  if (moduleId === "refunds" && props.refunds) {
    return wrap(
      moduleId,
      <AdminFinanceRefundsDepthPanel
        items={props.refunds.items}
        loading={props.refunds.loading}
        error={props.refunds.error}
      />,
    );
  }
  if (moduleId === "export" && props.exportPanel) {
    return wrap(
      moduleId,
      <AdminFinanceExportDepthPanel
        exporting={props.exportPanel.exporting}
        onExport={props.exportPanel.onExport}
        meta={props.exportPanel.meta}
      />,
    );
  }
  if (moduleId === "reconciliation" && props.reconciliation) {
    return wrap(
      moduleId,
      <AdminFinanceReconciliationDepthPanel
        alignmentLabel={props.reconciliation.alignmentLabel}
        driftDeltaLine={props.reconciliation.driftDeltaLine}
        crossDeltaLine={props.reconciliation.crossDeltaLine}
        loading={props.reconciliation.loading}
        error={props.reconciliation.error}
      />,
    );
  }
  if (moduleId === "cross-check" && props.crossCheck) {
    return wrap(
      moduleId,
      <AdminFinanceCrossCheckDepthPanel
        status={props.crossCheck.status}
        slotCount={props.crossCheck.slotCount}
        loading={props.crossCheck.loading}
        error={props.crossCheck.error}
      />,
    );
  }
  if (moduleId === "fee-router" && props.feeRouter) {
    return wrap(
      moduleId,
      <AdminFinanceFeeRouterDepthPanel
        total={props.feeRouter.total}
        minBlock={props.feeRouter.minBlock}
        maxBlock={props.feeRouter.maxBlock}
        latestInserted={props.feeRouter.latestInserted}
        loading={props.feeRouter.loading}
        error={props.feeRouter.error}
      />,
    );
  }
  if (moduleId === "audit" && props.audit) {
    return wrap(
      moduleId,
      <AdminFinanceAuditDepthPanel
        entryCount={props.audit.entryCount}
        latestAction={props.audit.latestAction}
        latestActor={props.audit.latestActor}
        loading={props.audit.loading}
        error={props.audit.error}
      />,
    );
  }
  if (moduleId === "drift" && props.drift) {
    return wrap(
      moduleId,
      <AdminFinanceDriftDepthPanel
        driftDetected={props.drift.driftDetected}
        status={props.drift.status}
        loading={props.drift.loading}
        error={props.drift.error}
      />,
    );
  }
  if (moduleId === "region-vault" && props.regionVault) {
    return wrap(
      moduleId,
      <AdminFinanceRegionVaultDepthPanel
        total={props.regionVault.total}
        minBlock={props.regionVault.minBlock}
        maxBlock={props.regionVault.maxBlock}
        latestInserted={props.regionVault.latestInserted}
        loading={props.regionVault.loading}
        error={props.regionVault.error}
      />,
    );
  }
  if (moduleId === "indexer" && props.indexer) {
    return wrap(
      moduleId,
      <AdminFinanceIndexerDepthPanel
        checkpointBlock={props.indexer.checkpointBlock}
        checkpointLog={props.indexer.checkpointLog}
        lagBlocks={props.indexer.lagBlocks}
        reorgDetected={props.indexer.reorgDetected}
        replayRequired={props.indexer.replayRequired}
        loading={props.indexer.loading}
        error={props.indexer.error}
      />,
    );
  }
  if (moduleId === "reconcile-reports" && props.reconcileReports) {
    return wrap(
      moduleId,
      <AdminFinanceReconcileReportsDepthPanel
        total={props.reconcileReports.total}
        page={props.reconcileReports.page}
        limit={props.reconcileReports.limit}
        reportType={props.reconcileReports.reportType}
        hasActiveFilters={props.reconcileReports.hasActiveFilters}
        loading={props.reconcileReports.loading}
        error={props.reconcileReports.error}
      />,
    );
  }
  if (moduleId === "observability" && props.observability) {
    return wrap(
      moduleId,
      <AdminFinanceObservabilityDepthPanel
        chainId={props.observability.chainId}
        indexerLag={props.observability.indexerLag}
        status={props.observability.status}
        loading={props.observability.loading}
        error={props.observability.error}
      />,
    );
  }
  if (moduleId === "trust-growth" && props.trustGrowth) {
    return wrap(
      moduleId,
      <AdminFinanceTrustGrowthDepthPanel
        environment={props.trustGrowth.environment}
        autopilotGeneration={props.trustGrowth.autopilotGeneration}
        alertsCount={props.trustGrowth.alertsCount}
        weightsFrozen={props.trustGrowth.weightsFrozen}
        loading={props.trustGrowth.loading}
        error={props.trustGrowth.error}
      />,
    );
  }
  if (moduleId === "alert-incidents" && props.alertIncidents) {
    return wrap(
      moduleId,
      <AdminFinanceAlertIncidentsDepthPanel
        syncedIncidentId={props.alertIncidents.syncedIncidentId}
        hasSyncedIncident={props.alertIncidents.hasSyncedIncident}
        loading={props.alertIncidents.loading}
        error={props.alertIncidents.error}
      />,
    );
  }
  return null;
}
