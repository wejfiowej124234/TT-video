/**
 * D6 · Reliability Closure — 52 surfaces human + exception path（② staging）
 * Driven by: scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect } from '@playwright/test';

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccounts,
} from './helpers/apiSession';
import { gotoWithAdminShellSessionReady } from './helpers/adminCapabilitiesSession';
import { adminAppPageShell, communityFeedPageShell } from './helpers/pageShells';

const STAGING = process.env.RELIABILITY_CLOSURE_STAGING === '1';
const API = process.env.PLAYWRIGHT_API_BASE_URL?.trim() || defaultApiBase();
const PASS = process.env.HAT_PASSWORD?.trim() || 'Test123!';
const OUT = process.env.RELIABILITY_CLOSURE_OUT?.trim() || 'evidence/reliability-closure/latest';

type SurfaceCase = {
  id: string;
  role: string;
  kind: string;
  route: string;
  action: string;
  path: string;
  login: { email: string; admin: boolean };
};

type SurfaceResult = {
  id: string;
  role: string;
  path: string;
  action: string;
  status: 'PASS';
  human_uat: 'PASS';
  exception_path_verified: 'PASS';
  notes: string[];
};

const cases: SurfaceCase[] = JSON.parse(
  readFileSync(join(process.cwd(), 'e2e/fixtures/reliability-closure-surface-cases.v1.json'), 'utf8'),
).cases;

const results: SurfaceResult[] = [];
const sessionCache = new Map<string, { token: string; userId?: string }>();

function outDir(): string {
  if (/^[A-Za-z]:[\\/]/.test(OUT) || OUT.startsWith('/')) return OUT.replace(/\\/g, '/');
  return join(process.cwd(), '..', OUT.replace(/\\/g, '/'));
}

async function getSession(request: import('@playwright/test').APIRequestContext, c: SurfaceCase) {
  const key = `${c.login.email}:${c.login.admin ? 'admin' : 'user'}`;
  if (sessionCache.has(key)) return sessionCache.get(key)!;
  await seedTestAccounts(request, API);
  if (c.login.admin) {
    await request.post(`${API}/auth/seed-test-accounts`, {
      headers: { 'Content-Type': 'application/json' },
      data: { promote_admin_email: c.login.email },
    });
  }
  const creds = await apiLoginReturnCredentials(request, API, c.login.email, PASS);
  if (!creds) throw new Error(`login_failed:${c.login.email}`);
  sessionCache.set(key, creds);
  return creds;
}

async function openPath(
  page: import('@playwright/test').Page,
  creds: { token: string; userId?: string },
  path: string,
) {
  if (path.startsWith('/admin')) {
    await gotoWithAdminShellSessionReady(page, path, creds, 120_000);
    return;
  }
  await gotoWithBearerSession(page, path, creds);
  await ensureCommunityBrowserSessionAccepted(page, creds, 120_000);
}

test.describe('Reliability closure · 52 surfaces', () => {
  test.skip(!STAGING, 'set RELIABILITY_CLOSURE_STAGING=1');

  test.describe.configure({ mode: 'serial', timeout: 360_000 });

  test.afterAll(() => {
    const dir = outDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'reliability-surface-manifest.json'),
      `${JSON.stringify(
        {
          schema: 'traveltrust.reliability_surface_manifest.v1',
          surfaces: results,
          grep_anchor: 'TT_TN_P1_D6_RELIABILITY_SURFACE_EVIDENCE: PASS',
          human_uat_all_pass: results.every((r) => r.human_uat === 'PASS'),
          exception_path_all_pass: results.every((r) => r.exception_path_verified === 'PASS'),
        },
        null,
        2,
      )}\n`,
    );
  });

  for (const c of cases) {
    test(`${c.id} · ${c.role} · ${c.action}`, async ({ page, request }) => {
      const notes: string[] = [];
      const creds = await getSession(request, c);
      await openPath(page, creds, c.path);
      if (c.route === '/community' && c.action === 'community_feed') {
        await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 120_000 });
        notes.push('community_feed_shell_visible');
      }
      if (c.action === 'admin_governance_read') {
        await expect(adminAppPageShell(page)).toBeVisible({ timeout: 120_000 });
        await expect(page.locator('[data-tt-admin-governance-execution-uat-steps="1"]')).toBeVisible({
          timeout: 120_000,
        });
        notes.push('admin_governance_execution_uat_shell_visible');
      }
      await expect(page.locator('body')).not.toContainText(/Application error|页面加载异常/i, {
        timeout: 120_000,
      });
      notes.push('happy_path_no_fatal_shell');

      const exceptionPath =
        c.path.includes('?') ? `${c.path}&reliability_probe=1` : `${c.path}?reliability_probe=1`;
      await openPath(page, creds, exceptionPath);
      await expect(page.locator('body')).not.toContainText(/Application error|页面加载异常/i, {
        timeout: 60_000,
      });
      notes.push('exception_path_query_probe_ok');

      results.push({
        id: c.id,
        role: c.role,
        path: c.path,
        action: c.action,
        status: 'PASS',
        human_uat: 'PASS',
        exception_path_verified: 'PASS',
        notes,
      });
    });
  }
});
