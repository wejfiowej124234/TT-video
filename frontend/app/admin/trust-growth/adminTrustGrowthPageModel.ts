import { ADMIN_VARIANT_BAR_CONTROL_CLASS, ADMIN_VARIANT_BAR_MINIMAL_CLASS } from "@/lib/adminUi";

export type VariantRow = {
  variant_id?: string;
  views?: number;
  clicks?: number;
  ctr?: number;
  weight?: number;
};

export type ViewShare = { variant_id?: string; view_share?: number };

export type MomentBlock = {
  moment?: string;
  total_views?: number;
  variants?: VariantRow[];
  view_distribution?: ViewShare[];
};

export type ObsBody = {
  anchor?: string;
  environment?: string;
  runtime?: {
    autopilot_generation?: number;
    updated_at?: string;
    moments?: Record<string, Record<string, number>>;
  };
  control?: {
    weights_frozen?: boolean;
    force_control_only?: boolean;
    variant_weight_caps?: Record<string, number>;
    control_updated_at?: string;
  };
  metrics?: { by_moment?: MomentBlock[] };
  generation_history?: { autopilot_generation: number; recorded_at: string }[];
  alerts?: {
    code?: string;
    severity?: string;
    moment?: string;
    variant_id?: string;
    detail?: string;
  }[];
  thresholds?: Record<string, unknown>;
};

/** Full observability payload stashed in list-fetch meta by `useAdminTrustGrowthPage`. */
export const ADMIN_TRUST_GROWTH_OBS_META_KEY = "__adminTrustGrowthObs";

export const VARIANT_BAR_CLASS: Record<string, string> = {
  control: ADMIN_VARIANT_BAR_CONTROL_CLASS,
  minimal_delayed: ADMIN_VARIANT_BAR_MINIMAL_CLASS,
  alt_copy: "bg-warning",
};

export function formatCapsJson(caps: Record<string, number> | undefined): string {
  if (!caps || Object.keys(caps).length === 0) return "{}";
  try {
    return JSON.stringify(caps, null, 2);
  } catch {
    return "{}";
  }
}

export function formatPct(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(1)}%`;
}

export function formatCtr(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(2)}%`;
}
