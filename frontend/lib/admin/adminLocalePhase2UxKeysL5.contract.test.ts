import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_ADM_U01_SHELL_PREP_FLOWS } from "@/lib/admin/adminPhase2LocalPrepCommands";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

const PHASE2_UX_KEYS = [
  "admin_phase2_staging_record_title",
  "admin_phase2_staging_record_honesty",
  "admin_onboarding_dual_ledger_nav_aria",
  "admin_onboarding_dual_ledger_payment",
  "admin_onboarding_webhook_ledger_retry",
  "admin_fin_workflow_partial_honesty",
  ...ADMIN_ADM_U01_SHELL_PREP_FLOWS.flatMap((f) => [f.titleKey, f.descKey]),
] as const;

/** ① Batch13+ · Phase②/ONB/FIN 新 UX 键 zh/en 成对。 */
describe("admin locale phase2 UX keys L5 (①)", () => {
  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");

  it("zh/en contain all phase2 UX keys", () => {
    for (const key of PHASE2_UX_KEYS) {
      expect(zh, key).toContain(`${key}:`);
      expect(en, key).toContain(`${key}:`);
    }
  });
});
