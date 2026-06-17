/**
 * Onboarding Hub phase assertion — SSOT: meIdentitiesCoreCardModel.ts
 * Usage: npx tsx assert-onboarding-hub-phase.ts <surface> <expected> <meJson|@file> <entJson|@file>
 */
import { readFileSync } from "node:fs";
import {
  deriveMeIdentitiesCorePhase,
  parseMeIdentitiesCoreCardSignals,
  type MeIdentitiesCoreSurface,
} from "@/lib/me/meIdentitiesCoreCardModel";

const [surfaceArg, expected, meRaw, entRaw] = process.argv.slice(2);
if (!surfaceArg || !expected) {
  console.error(
    "usage: assert-onboarding-hub-phase.ts <surface> <expected> <meJson|@file> <entJson|@file>",
  );
  process.exit(1);
}

const surface: MeIdentitiesCoreSurface =
  surfaceArg === "steward" || surfaceArg === "region_steward" ? "steward" : "provider";

function loadJsonArg(raw: string | undefined): unknown {
  if (!raw) return {};
  const text = raw.startsWith("@") ? readFileSync(raw.slice(1), "utf8") : raw;
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

const mePayload = loadJsonArg(meRaw);
const entPayload = loadJsonArg(entRaw);

const signals = parseMeIdentitiesCoreCardSignals({
  surface,
  loggedIn: true,
  mePayload,
  slotState: null,
  providerApplicationRaw: null,
  stewardApplicationRaw: null,
  entitlementsRaw: entPayload,
  providerRegistrationDraft: null,
});

const phase = deriveMeIdentitiesCorePhase(signals);

if (phase !== expected) {
  console.error(
    `assert-onboarding-hub-phase: FAIL surface=${surface} expected=${expected} got phase=${phase} role=${signals.userRole ?? "undefined"}`,
  );
  process.exit(1);
}

console.log(`assert-onboarding-hub-phase: OK surface=${surface} expected=${expected}`);
process.exit(0);
