import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";
import { TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST } from "@/lib/traveltrust/home/visualQaChecklist";
import { TRAVELTRUST_HOME_VISUAL_QA_CODE_EVIDENCE } from "@/lib/traveltrust/home/visualQaEvidence";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const mod = dirname(fileURLToPath(import.meta.url));

function walkSources(dir: string, parts: string[]): void {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      if (name === "cinematic-bridge" || name === "node_modules") continue;
      walkSources(abs, parts);
      continue;
    }
    if ((name.endsWith(".ts") || name.endsWith(".tsx")) && !name.includes(".test.")) {
      parts.push(readFileSync(abs, "utf8"));
    }
  }
}

function readTraveltrustHomeCodeBundle(): string {
  const parts: string[] = [];
  for (const p of [
    join(root, "lib/traveltrust/home"),
    join(mod, "presentation"),
    join(mod, "sections"),
    join(mod, "hooks"),
    join(root, "app/traveltrust"),
    join(root, "components/traveltrust/cinematic"),
    join(root, "components/traveltrust/cinematic/page-scene"),
  ]) {
    walkSources(p, parts);
  }
  return parts.join("\n");
}

describe("traveltrust-home visual QA checklist (local phase ①)", () => {
  const bundle = readTraveltrustHomeCodeBundle();

  it("exports checklist and code evidence for all 10 items", () => {
    expect(TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST.length).toBe(10);
    expect(Object.keys(TRAVELTRUST_HOME_VISUAL_QA_CODE_EVIDENCE).length).toBe(10);
    for (const item of TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST) {
      expect(item.path.startsWith(TRAVELTRUST_HOME_LAYOUT_LOCK_L5.route)).toBe(true);
    }
  });

  it("maps every checklist id to code evidence needles in bundle", () => {
    for (const item of TRAVELTRUST_HOME_VISUAL_QA_CHECKLIST) {
      const needles = TRAVELTRUST_HOME_VISUAL_QA_CODE_EVIDENCE[item.id];
      expect(needles?.length, item.id).toBeGreaterThan(0);
      for (const needle of needles) {
        expect(bundle, `${item.id} missing "${needle}"`).toContain(needle);
      }
    }
  });
});
