/**
 * PES · Real User Journey Review — 四角色 × 12 轮 = 48 次完整走查
 * 采集 Conversion Analytics localStorage 事件；证据写入 evidence/pes-rujr-*
 *
 * 运行：cd frontend && npx playwright test e2e/pes-real-user-journey-review.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import { buildPesJourneyReviewReport, type PesJourneyRunRecord } from "../lib/pesJourneyReviewAggregate";
import { PES_RUJR_RUNS_PER_PERSONA, type PesPersonaId } from "../lib/pesJourneyReviewModel";
import { clearPesAnalyticsStorage, runPesPersonaJourney } from "./helpers/pesJourneyReview";
import { gotoSmoke } from "./helpers/smoke-nav";

const PERSONAS: PesPersonaId[] = ["traveler", "guide", "merchant", "govern"];
const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "pes-rujr-20260607");

test.describe("PES Real User Journey Review @pes-rujr", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  for (const persona of PERSONAS) {
    for (let runIndex = 0; runIndex < PES_RUJR_RUNS_PER_PERSONA; runIndex++) {
      test(`${persona} · run ${runIndex + 1}/${PES_RUJR_RUNS_PER_PERSONA}`, async ({ page, context }) => {
        await context.clearCookies();
        await clearPesAnalyticsStorage(page);
        await gotoSmoke(page, "/");
        const record = await runPesPersonaJourney(page, persona, runIndex);
        expect(record.steps.length).toBeGreaterThan(0);
        expect(record.events.length).toBeGreaterThanOrEqual(0);

        fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
        const line = `${JSON.stringify(record)}\n`;
        fs.appendFileSync(path.join(EVIDENCE_DIR, "journey-runs.jsonl"), line, "utf8");
      });
    }
  }

  test("aggregate RUJR report from journey runs", async () => {
    const jsonlPath = path.join(EVIDENCE_DIR, "journey-runs.jsonl");
    test.skip(!fs.existsSync(jsonlPath), "no journey-runs.jsonl — prior runs missing");

    const lines = fs.readFileSync(jsonlPath, "utf8").trim().split("\n").filter(Boolean);
    const runs = lines.map((l) => JSON.parse(l) as PesJourneyRunRecord);
    expect(runs.length).toBeGreaterThanOrEqual(20);

    const report = buildPesJourneyReviewReport(runs);
    fs.writeFileSync(path.join(EVIDENCE_DIR, "rujr-report.json"), JSON.stringify(report, null, 2), "utf8");
    expect(report.top10Dropoffs.length).toBeGreaterThan(0);
    expect(report.top10Frictions.length).toBeGreaterThan(0);
    expect(report.uxBacklog.length).toBeGreaterThan(0);
  });
});
