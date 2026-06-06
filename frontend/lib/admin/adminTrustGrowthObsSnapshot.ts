import type { ObsBody } from "@/app/admin/trust-growth/adminTrustGrowthPageModel";

/** FIN-02 · 信任增长 observability 摘要（partial 深度）。 */
export function adminTrustGrowthObsSnapshot(data: ObsBody | null) {
  if (!data) {
    return {
      environment: null as string | null,
      autopilotGeneration: null as number | null,
      alertsCount: 0,
      weightsFrozen: null as boolean | null,
    };
  }
  return {
    environment: data.environment ?? null,
    autopilotGeneration: data.runtime?.autopilot_generation ?? null,
    alertsCount: data.alerts?.length ?? 0,
    weightsFrozen: data.control?.weights_frozen ?? null,
  };
}
