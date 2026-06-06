import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const appAdmin = join(fe, "app", "admin");

const QUEUE_PAGES: { file: string; key: string }[] = [
  { file: "provider-applications/AdminProviderApplicationsPageMain.tsx", key: "admin_provider_list_subtitle_l5" },
  { file: "steward-applications/AdminStewardApplicationsPageMain.tsx", key: "admin_steward_list_subtitle_l5" },
  { file: "onboarding/payment-events/page.tsx", key: "admin_onb_payment_events_subtitle_l5" },
  { file: "onboarding/webhook-jobs/page.tsx", key: "admin_onb_webhook_jobs_subtitle_l5" },
  { file: "onboarding/compliance-audit/page.tsx", key: "admin_onb_compliance_subtitle_l5" },
  { file: "onboarding/entitlements/page.tsx", key: "admin_onb_entitlements_subtitle_l5" },
];

/** ① 第三十八批 UX · 入驻/队列 subtitle 产品化。 */
describe("admin batch38 UX L5 (①)", () => {
  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");

  it("defines paired queue/onboarding _subtitle_l5 keys", () => {
    for (const { key } of QUEUE_PAGES) {
      expect(zh).toContain(key);
      expect(en).toContain(key);
    }
  });

  it("queue/onboarding pages use _subtitle_l5 subtitleKey", () => {
    for (const { file, key } of QUEUE_PAGES) {
      expect(readFileSync(join(appAdmin, file), "utf8")).toContain(key);
    }
  });
});
