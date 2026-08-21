import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HOME_LIFECYCLE_EVIDENCE_FIELDS,
  TRAVELTRUST_HOME_LIFECYCLE_LEDGER_PATH,
  TRAVELTRUST_HOME_M07_LIFECYCLE_PATH,
  TRAVELTRUST_HOME_MODULE_IDS,
  TRAVELTRUST_HOME_MODULE_LIFECYCLE,
  TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP,
  TRAVELTRUST_HOME_MODULE_MARKER_ATTR,
  TRAVELTRUST_HOME_MODULE_REGISTRY_ID,
  TRAVELTRUST_HOME_MODULE_SLUGS,
  TRAVELTRUST_HOME_SECTION_TO_MODULE,
  TRAVELTRUST_HOME_THIS_WAVE_LOCKED_MODULE_IDS,
  traveltrustHomeModuleIdForSection,
  traveltrustHomeModuleMarker,
  traveltrustHomeModuleMayEnterReleaseScope,
} from "@/lib/traveltrustHomeModuleRegistry";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("traveltrustHomeModuleRegistry", () => {
  it("keeps YAML SSOT and TS mirror on the same Module IDs", () => {
    const yaml = readFileSync(join(root, "../registry/traveltrust-home-module-registry.v1.yaml"), "utf8");
    expect(yaml).toContain("schema: traveltrust.home_module_registry.v1");
    expect(yaml).toContain("id: TRAVELTRUST_HOME_MODULAR_RELEASE_V1");
    expect(yaml).toContain("tt_production_go: NO_GO");
    expect(yaml).toContain("forbid:");
    expect(yaml).toContain("- officialBody");
    expect(yaml).toContain("- localBody");
    expect(yaml).toContain("- tt_home_variant");
    for (const id of TRAVELTRUST_HOME_MODULE_IDS) {
      expect(yaml).toContain(`id: ${id}`);
      expect(yaml).toContain(`slug: ${TRAVELTRUST_HOME_MODULE_SLUGS[id]}`);
    }
    expect(TRAVELTRUST_HOME_MODULE_REGISTRY_ID).toBe("TRAVELTRUST_HOME_MODULAR_RELEASE_V1");
  });

  it("maps sections without inventing dual-track bodies", () => {
    expect(traveltrustHomeModuleIdForSection("hero")).toBe("M04");
    expect(traveltrustHomeModuleIdForSection("unlock")).toBe("M07");
    expect(traveltrustHomeModuleIdForSection("faq")).toBe("M10");
    expect(traveltrustHomeModuleIdForSection("start")).toBe("M11");
    expect(TRAVELTRUST_HOME_SECTION_TO_MODULE.pulse).toBe("M03");
    expect(traveltrustHomeModuleMarker("M01")).toEqual({
      [TRAVELTRUST_HOME_MODULE_MARKER_ATTR]: "M01",
    });
    expect([...TRAVELTRUST_HOME_THIS_WAVE_LOCKED_MODULE_IDS]).toEqual(["M01", "M02", "M03"]);
  });

  it("records pending Unlock vs remounted FAQ/Start instead of forcing equal counts", () => {
    const yaml = readFileSync(join(root, "../registry/traveltrust-home-module-registry.v1.yaml"), "utf8");
    expect(yaml).toMatch(/id: M07[\s\S]*registry_status: LOCAL_ONLY_PENDING/);
    expect(yaml).toMatch(/id: M07[\s\S]*production: absent/);
    expect(yaml).toMatch(/id: M07[\s\S]*staging: absent/);
    expect(yaml).toMatch(/id: M10[\s\S]*registry_status: DEPRECATED/);
    expect(yaml).toMatch(/id: M10[\s\S]*local: archived/);
    expect(yaml).toContain("id: M11");
    expect(yaml).toContain("staging_runtime_observation:");
    expect(yaml).toContain("auto_ship_LOCAL_ONLY_PENDING");
    expect(yaml).toContain("skip_READY_FOR_RELEASE");
    expect(yaml).toContain("local_to_official_jump");
    expect(yaml).toContain("auto_r1_rebaseline");
    expect(yaml).toContain("hand_edit_READY_without_evidence");
    expect(yaml).toContain("stamp_CANONICAL_ACTIVE_before_deploy");
    expect(yaml).toContain("stamp_CANONICAL_ACTIVE_before_runtime_pass");
    expect(yaml).toContain("delete_PROD_ONLY_to_match_local");
    expect(yaml).toContain("force_equal_module_count_before_mapping");
    expect(yaml).toContain("r1_rebaseline:");
    expect(yaml).toMatch(/r1_rebaseline:[\s\S]*status: NOT_STARTED/);
  });

  it("fixes five Module Lifecycle states and forbids Local→Official jump for M07", () => {
    expect([...TRAVELTRUST_HOME_MODULE_LIFECYCLE]).toEqual([
      "CANONICAL_ACTIVE",
      "LOCAL_ONLY_PENDING",
      "READY_FOR_RELEASE",
      "PROD_ONLY_REBASE",
      "DEPRECATED",
    ]);
    expect(TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP.CANONICAL_ACTIVE).toBe("yes");
    expect(TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP.LOCAL_ONLY_PENDING).toBe("no");
    expect(TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP.READY_FOR_RELEASE).toBe("auth_required");
    expect(TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP.PROD_ONLY_REBASE).toBe("no");
    expect(TRAVELTRUST_HOME_MODULE_LIFECYCLE_SHIP.DEPRECATED).toBe("dedicated_delete_release");
    expect([...TRAVELTRUST_HOME_M07_LIFECYCLE_PATH]).toEqual([
      "LOCAL_ONLY_PENDING",
      "READY_FOR_RELEASE",
      "RELEASE_SCOPE_PASS",
      "STAGING_OR_PRODUCTION_DEPLOY",
      "RUNTIME_VERIFICATION_PASS",
      "CANONICAL_ACTIVE",
    ]);
    expect([...TRAVELTRUST_HOME_LIFECYCLE_EVIDENCE_FIELDS]).toEqual([
      "module_id",
      "from_state",
      "to_state",
      "git_sha",
      "tests",
      "timestamp",
      "reason",
    ]);
    expect(TRAVELTRUST_HOME_LIFECYCLE_LEDGER_PATH).toBe(
      "registry/traveltrust-home-module-lifecycle-ledger.v1.json",
    );
    expect(traveltrustHomeModuleMayEnterReleaseScope("LOCAL_ONLY_PENDING")).toBe(false);
    expect(traveltrustHomeModuleMayEnterReleaseScope("LOCAL_ONLY_PENDING", { ownerAuth: true })).toBe(false);
    expect(traveltrustHomeModuleMayEnterReleaseScope("READY_FOR_RELEASE")).toBe(false);
    expect(traveltrustHomeModuleMayEnterReleaseScope("READY_FOR_RELEASE", { ownerAuth: true })).toBe(true);
    expect(traveltrustHomeModuleMayEnterReleaseScope("CANONICAL_ACTIVE")).toBe(true);
    expect(traveltrustHomeModuleMayEnterReleaseScope("PROD_ONLY_REBASE")).toBe(false);
    expect(traveltrustHomeModuleMayEnterReleaseScope("DEPRECATED")).toBe(false);
    expect(traveltrustHomeModuleMayEnterReleaseScope("DEPRECATED", { deleteRelease: true })).toBe(true);
    const yaml = readFileSync(join(root, "../registry/traveltrust-home-module-registry.v1.yaml"), "utf8");
    expect(yaml).not.toContain("ENV_SPECIFIC");
    expect(yaml).not.toContain("PROD_ONLY_REBASE_REQUIRED");
    expect(yaml).not.toContain("TT_HOME_ALLOW_PENDING_SCOPE");
    expect(yaml).toContain("deploy_fail_keeps: READY_FOR_RELEASE");
    const ledger = JSON.parse(
      readFileSync(join(root, "../registry/traveltrust-home-module-lifecycle-ledger.v1.json"), "utf8"),
    );
    expect(ledger.schema).toBe("traveltrust.home_module_lifecycle_transition.v1");
    expect(ledger.entries).toEqual([]);
    expect(existsSync(join(root, "../scripts/dev/record-traveltrust-home-module-lifecycle.py"))).toBe(true);
    const scopeGate = readFileSync(join(root, "../scripts/gates/check-traveltrust-home-release-scope.py"), "utf8");
    expect(scopeGate).toContain("TT_HOME_ALLOW_PENDING_SCOPE is retired");
    expect(scopeGate).toContain("TT_HOME_MODULE_RELEASE_AUTH");
    expect(scopeGate).toContain("fly_deploy=NOT_THIS_GATE");
  });

  it("hangs Module IDs on chrome and body without dropping layer-1 isolation", () => {
    const chrome = readFileSync(
      join(root, "modules/traveltrust-home/presentation/TravelTrustLockedHomeChrome.tsx"),
      "utf8",
    );
    const body = readFileSync(
      join(root, "modules/traveltrust-home/presentation/TravelTrustHomeBodyModule.tsx"),
      "utf8",
    );
    const main = readFileSync(
      join(root, "modules/traveltrust-home/presentation/TravelTrustHomeMainColumn.tsx"),
      "utf8",
    );
    const header = readFileSync(join(root, "components/Header.tsx"), "utf8");
    const nav = readFileSync(join(root, "components/traveltrust/cinematic/TravelTrustLandingNav.tsx"), "utf8");
    const pulse = readFileSync(join(root, "components/traveltrust/cinematic/TravelTrustPulseTicker.tsx"), "utf8");
    expect(chrome).toContain('data-tt-locked-home-chrome="1"');
    expect(body).toContain('data-tt-home-body-module="1"');
    expect(main).toContain(TRAVELTRUST_HOME_MODULE_REGISTRY_ID);
    expect(header).toContain('data-tt-home-module": "M01"');
    expect(nav).toContain('data-tt-home-module="M02"');
    expect(pulse).toContain('data-tt-home-module="M03"');
    expect(body).not.toContain("officialBody");
    expect(body).not.toContain("localBody");
    expect(existsSync(join(root, "../scripts/gates/check-traveltrust-home-module-registry.py"))).toBe(true);
    expect(existsSync(join(root, "../scripts/gates/check-traveltrust-home-release-scope.py"))).toBe(true);
  });
});
