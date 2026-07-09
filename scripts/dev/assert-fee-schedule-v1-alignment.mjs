#!/usr/bin/env node
/** B 轨 fee_schedule_v1 · quote / payment-intent / entitlement 对拍（stdin JSON bundle） */
import fs from "node:fs";

const args = process.argv.slice(2);
const useStdin = args.includes("--stdin");

function fail(msg) {
  console.error(`assert-fee-schedule-v1-alignment: FAIL ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`assert-fee-schedule-v1-alignment: OK ${msg}`);
}

let raw = "";
if (useStdin) {
  raw = fs.readFileSync(0, "utf8");
} else if (args[0]) {
  raw = fs.readFileSync(args[0], "utf8");
} else {
  fail("usage: assert-fee-schedule-v1-alignment.mjs --stdin");
}

let bundle;
try {
  bundle = JSON.parse(raw);
} catch {
  fail("invalid JSON stdin");
}

const quote = bundle.quote || {};
const pi = bundle.paymentIntent || bundle.payment_intent || {};
const ent = bundle.entitlement || {};

const pick = (o, keys) => keys.map((k) => o[k]).find((v) => v != null && v !== "");

const sku = pick(quote, ["sku"]) || pick(pi, ["sku"]) || pick(ent, ["sku"]);
const ver = pick(quote, ["fee_schedule_version"]) || pick(pi, ["fee_schedule_version"]) || pick(ent, ["fee_schedule_version"]);
const amt =
  pick(quote, ["computed_amount_minor", "amount_minor"]) ||
  pick(pi, ["amount_minor"]) ||
  pick(ent, ["amount_minor"]);

if (!sku) fail("missing sku across quote/pi/entitlement");
if (ver && ver !== "fee_schedule_v1") fail(`fee_schedule_version=${ver}`);
if (quote.sku && pi.sku && quote.sku !== pi.sku) fail("quote.sku != paymentIntent.sku");
if (quote.sku && ent.sku && quote.sku !== ent.sku) fail("quote.sku != entitlement.sku");
if (quote.computed_amount_minor != null && pi.amount_minor != null) {
  const localDev = process.env.TRAVELTRUST_ONBOARDING_LOCAL_DEV === "1";
  if (!localDev && String(quote.computed_amount_minor) !== String(pi.amount_minor)) {
    fail(`amount mismatch quote=${quote.computed_amount_minor} pi=${pi.amount_minor}`);
  }
}

ok(`sku=${sku} version=${ver || "fee_schedule_v1"} amount=${amt ?? "n/a"}`);
process.exit(0);
