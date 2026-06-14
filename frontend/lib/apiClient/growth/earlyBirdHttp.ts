import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type EarlyBirdStageRow = {
  id: string;
  stage_number: number;
  user_rank_from: number;
  user_rank_to?: number | null;
  multiplier: number;
  is_active: boolean;
  updated_at?: string;
};

export type EarlyBirdStageStats = {
  stage_number: number;
  user_count: number;
};

export type EarlyBirdReconcileSummary = {
  next_rank: number;
  users_with_rank: number;
  users_with_stage: number;
  stage_mismatch_count: number;
};

export async function getAdminEarlyBirdStages(): Promise<{
  items?: EarlyBirdStageRow[];
  user_counts_by_stage?: EarlyBirdStageStats[];
}> {
  const res = await fetch(apiUrl(routes.adminGrowthEarlyBirdStages), {
    headers: { ...writeRequestHeaders(), "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminEarlyBirdStages", data);
  return data as { items?: EarlyBirdStageRow[]; user_counts_by_stage?: EarlyBirdStageStats[] };
}

export async function patchAdminEarlyBirdStage(
  stageNumber: number,
  body: {
    is_active?: boolean;
    user_rank_from?: number;
    user_rank_to?: number | null;
    multiplier?: number;
  },
): Promise<{ item?: EarlyBirdStageRow }> {
  const res = await fetch(
    apiUrl(`${routes.adminGrowthEarlyBirdStages}/${encodeURIComponent(String(stageNumber))}`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...writeRequestHeaders(),
        "x-request-id": requestId(),
      },
      body: JSON.stringify(body),
    },
  );
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminEarlyBirdStage", data);
  return data as { item?: EarlyBirdStageRow };
}

export async function getAdminEarlyBirdReconcile(): Promise<{ summary?: EarlyBirdReconcileSummary }> {
  const res = await fetch(apiUrl(routes.adminGrowthEarlyBirdReconcile), {
    headers: { ...writeRequestHeaders(), "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminEarlyBirdReconcile", data);
  return data as { summary?: EarlyBirdReconcileSummary };
}
