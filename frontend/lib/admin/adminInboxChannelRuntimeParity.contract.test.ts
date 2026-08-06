/**
 * Hard gate · Admin Inbox channel runtime parity.
 *
 * Prevents the recurring production crash:
 *   TypeError: Cannot read properties of undefined (reading 'permissionDenied')
 *
 * Root class: Focus UI renders a queue key that is missing from
 * AdminHomeInboxKey / HREFS / channels / fetch / permission map.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_HOME_INBOX_KEYS, type AdminHomeInboxKey } from "./adminHomeModel";
import { ADMIN_INBOX_CHANNEL_PERMISSION } from "./adminInboxChannelPermission";
import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { adminInboxQueueListFetchConfig } from "./adminHomeInboxQueueListCache";
import { ADMIN_HOME_INBOX_QUEUE_KEYS } from "./adminHomeInboxPendingTotal";
import { buildAdminUnifiedInboxTasks } from "./adminUnifiedInboxTasks";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

const EXPECTED_KEYS: readonly AdminHomeInboxKey[] = [
  "provider",
  "guide",
  "steward",
  "approvals",
  "disputes",
  "reports",
];

function stripKeysFromSource(src: string): string[] {
  const keys: string[] = [];
  const re = /key:\s*"([a-z_]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.push(m[1]);
  return keys;
}

function emptyChannels() {
  return Object.fromEntries(
    ADMIN_HOME_INBOX_KEYS.map((k) => [k, { count: 0, permissionDenied: false, errorKind: null }]),
  ) as Record<AdminHomeInboxKey, { count: number; permissionDenied: boolean; errorKind: null }>;
}

function emptyCounts() {
  return Object.fromEntries(ADMIN_HOME_INBOX_KEYS.map((k) => [k, 0])) as Record<
    AdminHomeInboxKey,
    number
  >;
}

describe("adminInboxChannelRuntimeParity (crash-class hard gate)", () => {
  it("canonical key list is frozen and includes guide", () => {
    expect([...ADMIN_HOME_INBOX_KEYS]).toEqual([...EXPECTED_KEYS]);
    expect(ADMIN_HOME_INBOX_KEYS).toContain("guide");
  });

  it("HREFS · permission · pending-total · fetch cover every canonical key", () => {
    for (const key of ADMIN_HOME_INBOX_KEYS) {
      expect(ADMIN_INBOX_QUEUE_HREFS[key], `missing HREF for ${key}`).toBeTruthy();
      expect(String(ADMIN_INBOX_QUEUE_HREFS[key]).startsWith("/admin/")).toBe(true);
      expect(ADMIN_INBOX_CHANNEL_PERMISSION[key], `missing permission for ${key}`).toBeTruthy();
      const cfg = adminInboxQueueListFetchConfig(key);
      expect(cfg.scope.length).toBeGreaterThan(0);
      expect(cfg.listUrl.startsWith("/api/v1/admin/")).toBe(true);
    }
    expect([...ADMIN_HOME_INBOX_QUEUE_KEYS].sort()).toEqual([...ADMIN_HOME_INBOX_KEYS].sort());
  });

  it("AdminHomeInboxStrip INBOX_LINKS keys ⊆ canonical keys (no orphan UI channel)", () => {
    const strip = readFileSync(join(fe, "components/admin/AdminHomeInboxStrip.tsx"), "utf8");
    const block = strip.slice(strip.indexOf("const INBOX_LINKS"), strip.indexOf("export function AdminHomeInboxStrip"));
    const uiKeys = stripKeysFromSource(block);
    expect(uiKeys.length).toBeGreaterThanOrEqual(ADMIN_HOME_INBOX_KEYS.length);
    for (const key of uiKeys) {
      expect(ADMIN_HOME_INBOX_KEYS, `UI key "${key}" missing from AdminHomeInboxKey`).toContain(
        key as AdminHomeInboxKey,
      );
    }
    // Focus Product Truth requires guide tile
    expect(uiKeys).toContain("guide");
  });

  it("useAdminHomeInbox EMPTY_COUNTS/CHANNELS declare every canonical key", () => {
    const src = readFileSync(join(__dir, "useAdminHomeInbox.ts"), "utf8");
    for (const key of ADMIN_HOME_INBOX_KEYS) {
      expect(src, `EMPTY_COUNTS missing ${key}`).toMatch(new RegExp(`${key}:\\s*null`));
      expect(src, `EMPTY_CHANNELS missing ${key}`).toMatch(
        new RegExp(`${key}:\\s*\\{\\s*count:\\s*null`),
      );
      expect(src, `fetchInboxChannel missing ${key}`).toContain(`fetchInboxChannel("${key}"`);
    }
  });

  it("unified tasks emit one task per canonical key without throwing", () => {
    const tasks = buildAdminUnifiedInboxTasks({
      counts: emptyCounts(),
      channels: emptyChannels(),
    });
    const ids = tasks.map((t) => t.id).sort();
    expect(ids).toEqual([...ADMIN_HOME_INBOX_KEYS].sort());
  });

  it("forbids unguarded channel.permissionDenied crash patterns in home strip/client", () => {
    const files = [
      "components/admin/AdminHomeInboxStrip.tsx",
      "components/admin/AdminHomeClient.tsx",
      "components/admin/AdminHomePrimaryCtas.tsx",
      "components/admin/AdminHomeFocusCompanion.tsx",
      "lib/admin/adminHomeSectionPending.ts",
      "lib/admin/adminHomeFocusModuleFilter.ts",
    ];
    const banned = [
      /channels\[[^\]]+\]\.permissionDenied/, // must use ?.
      /(?<![\w?.])ch\.permissionDenied/, // bare ch. without optional — allow ch?. 
    ];
    for (const rel of files) {
      const src = readFileSync(join(fe, rel), "utf8");
      // Allow only optional-chain forms
      expect(src, `${rel} uses channels[x].permissionDenied without ?.`).not.toMatch(
        /channels\[[^\]]+\]\.permissionDenied/,
      );
      // `if (ch.permissionDenied)` without optional is banned when ch may be missing
      const bareCh = src.match(/if\s*\(\s*ch\.permissionDenied/g);
      expect(bareCh, `${rel} has unguarded if (ch.permissionDenied)`).toBeNull();
      void banned;
    }
  });
});
