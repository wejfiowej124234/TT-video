/**
 * 93 **`93-matrix-admin-deep-batch.spec.ts`** 共享：证据目录、`deepCtx`、`beforeAll`/`afterAll`。
 * 用例体见 **`../93-matrix-admin-deep-batch.part1.ts`** / **`part2.ts`**（由入口 spec 导入）。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, type APIRequestContext } from "@playwright/test";
import { defaultApiBase } from "./apiSession";
import { requestGetWith429Retry } from "./playwright429Backoff";
import { skipIfApiDown } from "./skipIfApiDown";

export type AdminDeepBatchCtx = {
  apiBase: string;
  evidenceDir: string;
  chainOff: boolean;
};

export let deepCtx: AdminDeepBatchCtx | null = null;

function evidenceRunDir(): string {
  const id = process.env.ADMIN_DEEP_RUN_ID?.trim() || `run_${Date.now()}`;
  return join(process.cwd(), "..", "evidence", "93-batch-admin-deep-audit", id);
}

export function writeJson(rel: string, data: unknown) {
  if (!deepCtx) return;
  writeFileSync(join(deepCtx.evidenceDir, rel), JSON.stringify(data, null, 2), "utf-8");
}

export function writeTarget(
  id: string,
  row: { status: "PASS" | "SKIP" | "FAIL"; note?: string; evidence?: string[] },
) {
  writeJson(`target-${id}.json`, { id, ...row, at: new Date().toISOString() });
}

export async function fetchMeUser(
  request: APIRequestContext,
  apiBase: string,
  bearer: string,
): Promise<{ id: string; role: string } | null> {
  const res = await requestGetWith429Retry(request, `${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!res.ok()) return null;
  const j = (await res.json()) as { user?: { id?: string; role?: string } };
  const id = (j.user?.id ?? "").trim();
  const role = (j.user?.role ?? "").trim();
  if (!id || !role) return null;
  return { id, role };
}

test.beforeAll(async ({ request }) => {
  const apiBase = defaultApiBase();
  const health = await skipIfApiDown(request);
  const metaRes = await requestGetWith429Retry(request, `${apiBase}/meta`).catch(() => null);
  const metaJson = metaRes?.ok() ? ((await metaRes.json()) as Record<string, unknown>) : null;
  const did = metaJson?.did_rank as Record<string, unknown> | undefined;
  const chainOff = did?.chain_off_mounted === true;
  const evidenceDir = evidenceRunDir();
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(
    join(evidenceDir, "meta-snapshot.json"),
    JSON.stringify(
      {
        apiBase,
        health_ok: health.ok(),
        meta_status: metaRes?.status() ?? null,
        did_rank: did ?? null,
        chain_off_mounted: chainOff,
      },
      null,
      2,
    ),
    "utf-8",
  );
  deepCtx = { apiBase, evidenceDir, chainOff };
});

test.afterAll(() => {
  if (!deepCtx) return;
  const dir = deepCtx.evidenceDir;
  const target_matrix: Record<string, unknown> = {};
  try {
    for (const name of readdirSync(dir)) {
      if (!name.startsWith("target-") || !name.endsWith(".json")) continue;
      const key = name.slice("target-".length, name.length - 5);
      try {
        target_matrix[key] = JSON.parse(readFileSync(join(dir, name), "utf-8")) as unknown;
      } catch {
        target_matrix[key] = { parse_error: true, file: name };
      }
    }
  } catch {
    /* ignore */
  }
  writeJson("report.json", {
    batch: "93-ADMIN-DEEP",
    evidenceDir: dir,
    chain_off_mounted: deepCtx.chainOff,
    finished_at: new Date().toISOString(),
    target_matrix,
  });
});
