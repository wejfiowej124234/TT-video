import type { TrustGrowthMoment } from "@/lib/trustGrowthAnalytics";

/** 文案变体：`default` 用 pgrow1_*，`alt` 用 pgrow2_alt_{moment}_* */
export type TrustGrowthCopyModule = "default" | "alt";

export type TrustGrowthVariantSpec = {
  id: string;
  /** 相对权重（同 moment 内求和） */
  weight: number;
  copyModule: TrustGrowthCopyModule;
  evidenceCount: 1 | 2 | 3;
  /** 进入页面后延迟展示（毫秒），用于「时机」实验 */
  delayMs: number;
  /** false 时标题外仅展示摘要行，要点与链收入 `<details>` 默认折叠 */
  defaultExpanded: boolean;
};

export type TrustGrowthMomentExperiment = {
  enabled: boolean;
  /** 变更后已存 assignment 会与版本比对并可能重新分流 */
  version: number;
  variants: TrustGrowthVariantSpec[];
};

/**
 * P-GROW2：各触点实验矩阵。生产可改权重/增删变体；分析按 variant_id + version 切片。
 * 环境变量 `NEXT_PUBLIC_TRUST_EXPERIMENTS_DISABLED=1` 时运行时强制 control（每 moment 第一档）。
 */
export const TRUST_GROWTH_EXPERIMENTS: Record<TrustGrowthMoment, TrustGrowthMomentExperiment> = {
  register: {
    enabled: true,
    version: 1,
    variants: [
      { id: "control", weight: 34, copyModule: "default", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
      {
        id: "minimal_delayed",
        weight: 33,
        copyModule: "default",
        evidenceCount: 1,
        delayMs: 1200,
        defaultExpanded: false,
      },
      { id: "alt_copy", weight: 33, copyModule: "alt", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
    ],
  },
  first_yield: {
    enabled: true,
    version: 1,
    variants: [
      { id: "control", weight: 34, copyModule: "default", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
      {
        id: "minimal_delayed",
        weight: 33,
        copyModule: "default",
        evidenceCount: 2,
        delayMs: 800,
        defaultExpanded: false,
      },
      { id: "alt_copy", weight: 33, copyModule: "alt", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
    ],
  },
  first_order: {
    enabled: true,
    version: 1,
    variants: [
      { id: "control", weight: 34, copyModule: "default", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
      {
        id: "minimal_delayed",
        weight: 33,
        copyModule: "default",
        evidenceCount: 1,
        delayMs: 0,
        defaultExpanded: false,
      },
      { id: "alt_copy", weight: 33, copyModule: "alt", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
    ],
  },
  governance_entry: {
    enabled: true,
    version: 1,
    variants: [
      { id: "control", weight: 34, copyModule: "default", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
      {
        id: "minimal_delayed",
        weight: 33,
        copyModule: "default",
        evidenceCount: 2,
        delayMs: 500,
        defaultExpanded: false,
      },
      { id: "alt_copy", weight: 33, copyModule: "alt", evidenceCount: 3, delayMs: 0, defaultExpanded: true },
    ],
  },
};
