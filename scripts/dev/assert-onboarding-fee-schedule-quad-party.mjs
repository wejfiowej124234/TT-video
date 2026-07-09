#!/usr/bin/env node
/** ONB-P2-005 · quote / payment-intent / entitlement / Stripe PI 四派对拍（stdin JSON bundle） */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const useStdin = args.includes("--stdin");
const piIdx = args.indexOf("--stripe-pi");
const stripePi = piIdx >= 0 ? args[piIdx + 1] : "";

function fail(msg) {
  console.error(`assert-onboarding-fee-schedule-quad-party: FAIL ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`assert-onboarding-fee-schedule-quad-party: OK ${msg}`);
}

let raw = "";
if (useStdin) {
  raw = fs.readFileSync(0, "utf8");
} else if (args[0]) {
  raw = fs.readFileSync(args[0], "utf8");
} else {
  fail("usage: assert-onboarding-fee-schedule-quad-party.mjs --stdin --stripe-pi <pi_id>");
}

let bundle;
try {
  bundle = JSON.parse(raw);
} catch {
  fail("invalid JSON stdin");
}

const triple = spawnSync(process.execPath, [path.join(__dirname, "assert-fee-schedule-v1-alignment.mjs"), "--stdin"], {
  input: raw,
  encoding: "utf8",
});
if (triple.status !== 0) {
  process.stderr.write(triple.stderr || triple.stdout || "");
  process.exit(triple.status || 1);
}

const ent = bundle.entitlement || {};
const refs = [ent.provider_payment_ref, ent.stripe_payment_intent_id].filter(Boolean);
if (!stripePi) fail("missing --stripe-pi");
if (refs.length && !refs.every((r) => String(r) === String(stripePi))) {
  fail(`stripe PI mismatch pi=${stripePi} entitlement=${refs.join(",")}`);
}

ok(`quad-party stripe_pi=${stripePi} entitlement=${ent.status || "paid"}`);
process.exit(0);
