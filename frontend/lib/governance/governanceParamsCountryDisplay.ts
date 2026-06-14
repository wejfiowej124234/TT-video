import type { CountryRow84 } from "@/lib/governanceParams84Readonly";

const PHASE1_COUNTRY_EN: Record<
  string,
  { name: string; notes?: string }
> = {
  中国: { name: "China", notes: "Major inbound tourism market" },
  美国: { name: "United States", notes: "High-spend market" },
  法国: { name: "France", notes: "Global destination" },
  西班牙: { name: "Spain", notes: "High consumption" },
  日本: { name: "Japan", notes: "Premium travel" },
  泰国: { name: "Thailand", notes: "Popular in Asia" },
  新加坡: { name: "Singapore", notes: "Premium hub" },
  韩国: { name: "South Korea", notes: "Asia" },
  澳大利亚: { name: "Australia", notes: "High consumption" },
  阿联酋: { name: "United Arab Emirates", notes: "Middle East" },
};

export function resolvePhase1CountryDisplay(
  row: CountryRow84,
  locale: string,
): { name: string; notes: string | undefined } {
  if (locale.startsWith("zh")) {
    return { name: row.name_zh, notes: row.notes };
  }
  const mapped = PHASE1_COUNTRY_EN[row.name_zh];
  return {
    name: mapped?.name ?? row.name_zh,
    notes: mapped?.notes ?? row.notes,
  };
}
