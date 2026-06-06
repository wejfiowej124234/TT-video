import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const appAdmin = join(__dir, "..", "..", "app", "admin");

function walkPageHeaders(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkPageHeaders(p));
    else if (name.endsWith("PageHeader.tsx")) out.push(p);
  }
  return out;
}

/** ① 第三十九批 UX · PageHeader 与 PageMain subtitle _l5 对齐。 */
describe("admin batch39 UX L5 (①)", () => {
  const headers = walkPageHeaders(appAdmin);

  it("PageHeader files avoid legacy _subtitle keys when _l5 exists", () => {
    const legacyPatterns = [
      /admin_users_subtitle"\)/,
      /admin_finance_subtitle"\)/,
      /admin_audit_list_subtitle"\)/,
      /admin_indexer_subtitle"\)/,
      /admin_api_versions_subtitle"\)/,
      /admin_lifecycle_subtitle"\)/,
      /admin_trust_growth_subtitle"\)/,
      /admin_compliance_requests_subtitle"\)/,
      /admin_config_releases_subtitle"\)/,
      /admin_tool_audits_subtitle"\)/,
      /admin_media_access_logs_subtitle"\)/,
      /admin_media_signed_url_tokens_subtitle"\)/,
      /admin_scheduler_jobs_subtitle"\)/,
      /admin_secrets_meta_subtitle"\)/,
    ];
    for (const file of headers) {
      const src = readFileSync(file, "utf8");
      for (const pattern of legacyPatterns) {
        expect(src, file).not.toMatch(pattern);
      }
    }
  });

  it("core PageHeader uses _subtitle_l5", () => {
    const users = readFileSync(join(appAdmin, "users", "AdminUsersPageHeader.tsx"), "utf8");
    expect(users).toContain("admin_users_subtitle_l5");
  });
});
