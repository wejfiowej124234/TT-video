#!/usr/bin/env node

/**

 * HAT-R1 / G24-BROWSER-ACCEPT-01 governance page screenshots (Playwright).

 *

 * Usage:

 *   cd frontend && npm run dev   # :3012

 *   node scripts/dev/capture-hat-r1-screenshots.mjs --evid evidence/GO_hat_r1_sepolia/latest

 *   node scripts/dev/capture-hat-r1-screenshots.mjs --mode=browser-acceptance --out evidence/.../screenshots

 *   node scripts/dev/capture-hat-r1-screenshots.mjs --step=step-02-stake --out evidence/.../step-02-stake/screenshots

 */

import { mkdir, writeFile } from "node:fs/promises";

import path from "node:path";



const argv = process.argv.slice(2);

const getArg = (name, def) => {

  const eq = argv.find((a) => a.startsWith(`${name}=`));

  if (eq) return eq.slice(name.length + 1);

  const i = argv.indexOf(name);

  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;

};



const MODE = getArg("--mode", "hat-r1");

const BASE = getArg("--base", process.env.HAT_R1_FRONTEND_BASE || "http://127.0.0.1:3012");

const STEP = getArg("--step", "");

const evidArg =

  getArg("--evid", "") ||

  (argv.includes("--evid") ? argv[argv.indexOf("--evid") + 1] : "");

const outExplicit = getArg("--out", "");



const BROWSER_ACCEPTANCE_ROUTES = [

  { name: "governance-hub", path: "/governance" },

  { name: "gov-params-freeze", path: "/governance/params#gov-params-tokenomics-freeze" },

  { name: "gov-params-treasury", path: "/governance/params#gov-params-treasury-policy" },

  { name: "gov-params-overview", path: "/governance/params#gov-params-overview" },

  { name: "governance-proposals", path: "/governance/proposals" },

  { name: "governance-proposals-create", path: "/governance/proposals/new" },

  { name: "governance-delegate", path: "/governance/delegate" },

  { name: "steward-workbench", path: "/governance?view=region" },

  { name: "distribution-claim", path: "/governance/distribution-claim" },

  { name: "distribution-accruals", path: "/governance/distribution-accruals" },

  { name: "fee-routes", path: "/governance/fee-routes" },

  { name: "vault-forwards", path: "/governance/vault-forwards" },

];



const HAT_R1_ROUTES = [

  { name: "governance-hub", path: "/governance" },

  { name: "governance-params-freeze", path: "/governance/params#gov-params-tokenomics-freeze" },

  { name: "governance-params-treasury", path: "/governance/params#gov-params-treasury-policy" },

  { name: "governance-proposals", path: "/governance/proposals" },

  { name: "steward-workbench", path: "/governance?view=region" },

  { name: "distribution-claim", path: "/governance/distribution-claim" },

];



const STEP_ROUTES = {

  "step-00-preflight": [

    { name: "governance-hub", path: "/governance" },

    { name: "gov-params-freeze", path: "/governance/params#gov-params-tokenomics-freeze" },

  ],

  "step-01-purchase": [

    { name: "gov-params-freeze", path: "/governance/params#gov-params-tokenomics-freeze" },

    { name: "governance-hub", path: "/governance" },

  ],

  "step-02-stake": [{ name: "steward-workbench", path: "/governance?view=region" }],

  "step-03-seat-application": [{ name: "steward-workbench", path: "/governance?view=region" }],

  "step-04-proposal-create": [

    { name: "governance-proposals-create", path: "/governance/proposals/new" },

    { name: "governance-proposals", path: "/governance/proposals" },

  ],

  "step-05-vote": [{ name: "governance-proposals", path: "/governance/proposals" }],

  "step-06-queue": [{ name: "governance-proposals", path: "/governance/proposals" }],

  "step-07-execute": [{ name: "governance-proposals", path: "/governance/proposals" }],

  "step-08-treasury-proposal": [

    { name: "gov-params-treasury", path: "/governance/params#gov-params-treasury-policy" },

    { name: "governance-proposals", path: "/governance/proposals" },

  ],

  "step-10-unstake": [{ name: "steward-workbench", path: "/governance?view=region" }],

};



function resolveOutDir() {

  if (outExplicit) return outExplicit;

  if (STEP && evidArg) return path.join(evidArg, STEP, "screenshots");

  if (evidArg) return path.join(evidArg, "screenshots");

  return "evidence/GO_hat_r1_sepolia/latest/screenshots";

}



function resolveRoutes() {

  if (STEP && STEP_ROUTES[STEP]) return STEP_ROUTES[STEP];

  if (MODE === "browser-acceptance") return BROWSER_ACCEPTANCE_ROUTES;

  return HAT_R1_ROUTES;

}



async function main() {

  const outDir = resolveOutDir();

  const routes = resolveRoutes();



  let chromium;

  try {

    const { createRequire } = await import("node:module");

    const req = createRequire(path.join(process.cwd(), "frontend", "package.json"));

    ({ chromium } = req("playwright"));

  } catch {

    await mkdir(outDir, { recursive: true });

    await writeFile(

      path.join(outDir, "README.txt"),

      "Install playwright: cd frontend && npx playwright install chromium\nThen re-run this script.",

    );

    console.log("HAT_R1_SCREENSHOTS: SKIP playwright not installed");

    process.exit(0);

  }

  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const manifest = { base: BASE, mode: MODE, step: STEP || null, shots: [] };

  for (const r of routes) {

    const url = `${BASE}${r.path}`;

    try {

      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

      const file = path.join(outDir, `${r.name}.png`);

      await page.screenshot({ path: file, fullPage: true });

      manifest.shots.push({ route: r.path, file, ok: true });

    } catch (e) {

      manifest.shots.push({ route: r.path, ok: false, error: String(e) });

    }

  }

  await browser.close();

  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("HAT_R1_SCREENSHOTS: OK", outDir);

}



main().catch((e) => {

  console.error(e);

  process.exit(1);

});

