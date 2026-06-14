/**
 * Phase ② · Staging UI Real User Sprint — 分步证据包写入
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function p2uiEvidenceRoot(): string {
  return (process.env.P2UI_EVID_ROOT ?? "").trim();
}

export function p2uiWebBase(): string {
  return (process.env.PLAYWRIGHT_BASE_URL ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
}

export function p2uiApiBase(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");
}

export function stagingUiSprintGate(): boolean {
  return (
    process.env.PHASE2_STAGING_UI_REAL_USER_SPRINT === "1" &&
    Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim())
  );
}

export function writeP2uiStepEvidence(
  stepId: string,
  status: "PASS" | "FAIL",
  note: string,
  rollbackBody: string,
  extras?: Record<string, string>,
): void {
  const root = p2uiEvidenceRoot();
  if (!root) return;
  const dir = join(root, stepId);
  mkdirSync(dir, { recursive: true });
  const web = p2uiWebBase();
  const api = p2uiApiBase();
  writeFileSync(
    join(dir, "STATUS.txt"),
    [
      `step: ${stepId}`,
      `status: ${status}`,
      `web: ${web}`,
      `api: ${api}`,
      `at: ${new Date().toISOString()}`,
      `note: ${note}`,
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "rollback.md"),
    [
      `# Rollback verification · ${stepId}`,
      "",
      "**Phase:** ② staging UI · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)",
      "",
      rollbackBody,
      "",
    ].join("\n"),
  );
  appendFileSync(join(dir, "run.log"), `TT_P2UI_STEP_${stepId}: ${status}\n`);
  if (extras) {
    for (const [name, content] of Object.entries(extras)) {
      writeFileSync(join(dir, name), content);
    }
  }
}

export function writeP2uiSummary(summary: Record<string, string>): void {
  const root = p2uiEvidenceRoot();
  if (!root) return;
  writeFileSync(join(root, "SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);
}
