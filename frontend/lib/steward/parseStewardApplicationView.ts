export type StewardApplicationStakeView = {
  id: string;
  jurisdictions: string[];
  walletAddress: string;
  status: string;
};

export function parseStewardApplicationStakeView(payload: unknown): StewardApplicationStakeView | null {
  if (!payload || typeof payload !== "object") return null;
  const app = (payload as Record<string, unknown>).application;
  if (!app || typeof app !== "object") return null;
  const row = app as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const wallet =
    typeof row.wallet_address === "string" ? row.wallet_address.trim() : "";
  const status = typeof row.status === "string" ? row.status : "";
  const jurisdictions = Array.isArray(row.jurisdictions)
    ? row.jurisdictions.filter((j): j is string => typeof j === "string" && j.trim().length > 0)
    : [];
  if (!id || !wallet || jurisdictions.length === 0) return null;
  return { id, jurisdictions, walletAddress: wallet, status };
}
