import type { NormalizedAdminCrossCheck } from "@/lib/apiClient";

export function formatAdminCrossCheckUnknownJson(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    const s = JSON.stringify(value, null, 2);
    return s ?? String(value);
  } catch {
    return String(value);
  }
}

export const ADMIN_CROSS_CHECK_SLOT_DEFS = [
  {
    id: "fee_pool_projection" as const,
    titleKey: "admin_cross_check_slot_fee_pool_projection" as const,
    index: 1,
    pick: (n: NormalizedAdminCrossCheck) => n.fee_pool_projection,
  },
  {
    id: "governance_pool_chain" as const,
    titleKey: "admin_cross_check_slot_governance_pool_chain" as const,
    index: 2,
    pick: (n: NormalizedAdminCrossCheck) => n.governance_pool_chain,
  },
  {
    id: "protocol_reference" as const,
    titleKey: "admin_cross_check_slot_protocol_reference" as const,
    index: 3,
    pick: (n: NormalizedAdminCrossCheck) => n.protocol_reference,
  },
] as const;
