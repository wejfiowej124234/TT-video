"use client";

import { useEffect, useMemo, useState } from "react";
import { TRUST_GROWTH_EXPERIMENTS, type TrustGrowthVariantSpec } from "@/config/trustGrowthExperiments";
import { trustGrowthApiUrl, type TrustGrowthMoment } from "@/lib/trustGrowthAnalytics";

export const PGROW2_SUBJECT_STORAGE = "tt_pgrow2_subject_v1";
export const PGROW2_ASSIGNMENT_STORAGE = "tt_pgrow2_assignment_v1";

type StoredAssignment = Record<string, { version: number; variantId: string }>;

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h >>> 0);
}

function experimentsDisabledRuntime(): boolean {
  return (
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_TRUST_EXPERIMENTS_DISABLED === "1"
  );
}

/** P-GROW3：`runtimeWeights` 来自 `GET /api/v1/trust-growth/config`（`trustGrowthApiUrl`）自动调权；缺省用静态 `weight` */
export function pickVariantIdWithWeights(
  subject: string,
  moment: TrustGrowthMoment,
  expVersion: number,
  variants: TrustGrowthVariantSpec[],
  runtimeWeights: Record<string, number> | null | undefined
): string {
  const ws = variants.map((v) => {
    const r = runtimeWeights?.[v.id];
    return typeof r === "number" && r > 0 ? r : v.weight;
  });
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return variants[0]?.id ?? "control";
  const bucket = djb2(`${subject}|${moment}|v${expVersion}`) % 10_000;
  const threshold = (bucket / 10_000) * total;
  let cum = 0;
  for (let i = 0; i < variants.length; i++) {
    cum += ws[i]!;
    if (threshold < cum) return variants[i]!.id;
  }
  return variants[variants.length - 1]!.id;
}

export type CopyKeySet = {
  title: string;
  lead: string;
  e1: string;
  e2: string;
  e3: string;
};

export function resolveTrustGrowthCopyKeys(
  moment: TrustGrowthMoment,
  copyModule: "default" | "alt"
): CopyKeySet {
  switch (moment) {
    case "register":
      return copyModule === "alt"
        ? {
            title: "pgrow2_alt_register_title",
            lead: "pgrow2_alt_register_lead",
            e1: "pgrow2_alt_register_e1",
            e2: "pgrow2_alt_register_e2",
            e3: "pgrow2_alt_register_e3",
          }
        : {
            title: "pgrow1_register_title",
            lead: "pgrow1_register_lead",
            e1: "pgrow1_register_e1",
            e2: "pgrow1_register_e2",
            e3: "pgrow1_register_e3",
          };
    case "first_yield":
      return copyModule === "alt"
        ? {
            title: "pgrow2_alt_yield_title",
            lead: "pgrow2_alt_yield_lead",
            e1: "pgrow2_alt_yield_e1",
            e2: "pgrow2_alt_yield_e2",
            e3: "pgrow2_alt_yield_e3",
          }
        : {
            title: "pgrow1_yield_title",
            lead: "pgrow1_yield_lead",
            e1: "pgrow1_yield_e1",
            e2: "pgrow1_yield_e2",
            e3: "pgrow1_yield_e3",
          };
    case "first_order":
      return copyModule === "alt"
        ? {
            title: "pgrow2_alt_order_title",
            lead: "pgrow2_alt_order_lead",
            e1: "pgrow2_alt_order_e1",
            e2: "pgrow2_alt_order_e2",
            e3: "pgrow2_alt_order_e3",
          }
        : {
            title: "pgrow1_order_title",
            lead: "pgrow1_order_lead",
            e1: "pgrow1_order_e1",
            e2: "pgrow1_order_e2",
            e3: "pgrow1_order_e3",
          };
    case "governance_entry":
      return copyModule === "alt"
        ? {
            title: "pgrow2_alt_governance_title",
            lead: "pgrow2_alt_governance_lead",
            e1: "pgrow2_alt_governance_e1",
            e2: "pgrow2_alt_governance_e2",
            e3: "pgrow2_alt_governance_e3",
          }
        : {
            title: "pgrow1_governance_title",
            lead: "pgrow1_governance_lead",
            e1: "pgrow1_governance_e1",
            e2: "pgrow1_governance_e2",
            e3: "pgrow1_governance_e3",
          };
    default: {
      const _e: never = moment;
      return _e;
    }
  }
}

export type TrustGrowthExperimentState =
  | { ready: false; variant: null; experimentVersion: number; subjectId: string | null }
  | {
      ready: true;
      variant: TrustGrowthVariantSpec;
      experimentVersion: number;
      subjectId: string;
    };

/**
 * 客户端稳定分流 + 实验参数。`ready` 为 true 前勿上报曝光。
 */
export function useTrustGrowthExperiment(moment: TrustGrowthMoment): TrustGrowthExperimentState {
  const [state, setState] = useState<TrustGrowthExperimentState>({
    ready: false,
    variant: null,
    experimentVersion: 0,
    subjectId: null,
  });

  useEffect(() => {
    let cancelled = false;
    const exp = TRUST_GROWTH_EXPERIMENTS[moment];
    const fallback = exp.variants[0];

    async function run() {
      if (!exp.enabled || experimentsDisabledRuntime()) {
        if (!cancelled) {
          setState({
            ready: true,
            variant: fallback,
            experimentVersion: exp.version,
            subjectId: "disabled",
          });
        }
        return;
      }

      let runtimeWeights: Record<string, number> | null = null;
      try {
        const res = await fetch(trustGrowthApiUrl("config"), { cache: "no-store" });
        if (res.ok) {
          const j = (await res.json()) as { moments?: Record<string, Record<string, number>> };
          const block = j.moments?.[moment];
          if (block && typeof block === "object") runtimeWeights = block;
        }
      } catch {
        runtimeWeights = null;
      }

      if (cancelled) return;

      let subject = "";
      try {
        subject = window.localStorage.getItem(PGROW2_SUBJECT_STORAGE) ?? "";
        if (!subject) {
          subject =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `s${Date.now()}-${Math.random().toString(36).slice(2)}`;
          window.localStorage.setItem(PGROW2_SUBJECT_STORAGE, subject);
        }
      } catch {
        subject = `anon-${moment}`;
      }

      let raw: StoredAssignment = {};
      try {
        raw = JSON.parse(window.localStorage.getItem(PGROW2_ASSIGNMENT_STORAGE) ?? "{}") as StoredAssignment;
      } catch {
        raw = {};
      }

      const key = moment;
      const prev = raw[key];
      let variantId: string;
      if (!prev || prev.version !== exp.version) {
        variantId = pickVariantIdWithWeights(subject, moment, exp.version, exp.variants, runtimeWeights);
        raw[key] = { version: exp.version, variantId };
        try {
          window.localStorage.setItem(PGROW2_ASSIGNMENT_STORAGE, JSON.stringify(raw));
        } catch {
          /* ignore */
        }
      } else {
        variantId = prev.variantId;
      }

      const variant = exp.variants.find((v) => v.id === variantId) ?? fallback;
      if (!cancelled) {
        setState({ ready: true, variant, experimentVersion: exp.version, subjectId: subject });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [moment]);

  return state;
}

/** 合并进埋点的稳定实验字段 */
export function useTrustGrowthAnalyticsExtras(
  exp: TrustGrowthExperimentState,
  moment: TrustGrowthMoment
): Record<string, string | number | boolean | undefined> {
  return useMemo(() => {
    if (!exp.ready || !exp.variant) {
      return {
        experiment: "pgrow2",
        moment,
        experiment_ready: false,
      };
    }
    const v = exp.variant;
    return {
      experiment: "pgrow2",
      moment,
      experiment_ready: true,
      experiment_version: exp.experimentVersion,
      variant_id: v.id,
      copy_module: v.copyModule,
      evidence_count: v.evidenceCount,
      delay_ms: v.delayMs,
      default_expanded: v.defaultExpanded,
      subject_stable: exp.subjectId ? exp.subjectId.slice(0, 8) : undefined,
    };
  }, [exp, moment]);
}
