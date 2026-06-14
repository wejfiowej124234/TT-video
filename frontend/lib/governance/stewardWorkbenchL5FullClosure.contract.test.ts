import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  STEWARD_CN_PROTOCOL_MIN_STAKE_TTG,
  STEWARD_WORKBENCH_L5_BANNED_COPY,
  STEWARD_WORKBENCH_L5_CLOSURE_FINDINGS,
  STEWARD_WORKBENCH_L5_LOCALE_KEYS,
  STEWARD_WORKBENCH_L5_OPEN_P0,
  STEWARD_WORKBENCH_L5_OPEN_P1,
  STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE,
  STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER,
  STEWARD_WORKBENCH_PAGE_L5_UI_FROZEN,
} from "./stewardWorkbenchL5ClosureSprintModel";
import { formatProtocolStewardStakeTtgUnits, formatTtgAmount } from "@/lib/steward/stewardStakeUiModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("steward workbench L5 full closure (① local · frozen)", () => {
  it("freeze doc is ACTIVE and P0/P1 closed", () => {
    const freeze = read("evidence/GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md");
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(STEWARD_WORKBENCH_PAGE_L5_UI_FROZEN).toBe(true);
    expect(STEWARD_WORKBENCH_L5_OPEN_P0).toHaveLength(0);
    expect(STEWARD_WORKBENCH_L5_OPEN_P1).toHaveLength(0);
    expect(STEWARD_WORKBENCH_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
  });

  it("locale keys exist and avoid banned copy", () => {
    for (const key of STEWARD_WORKBENCH_L5_LOCALE_KEYS) {
      const zhVal = (zh as Record<string, string>)[key];
      const enVal = (en as Record<string, string>)[key];
      expect(zhVal, `zh:${key}`).toBeTruthy();
      expect(enVal, `en:${key}`).toBeTruthy();
      expect(zhVal).not.toMatch(STEWARD_WORKBENCH_L5_BANNED_COPY);
      expect(enVal).not.toMatch(STEWARD_WORKBENCH_L5_BANNED_COPY);
    }
  });

  it("workbench main wires frozen marker and L5 IA", () => {
    const main = read("app/governance/StewardRegionWorkbenchMain.tsx");
    expect(main).toContain("STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE");
    expect(main).toContain("STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER");
    expect(main).toContain("StewardWorkbenchStakingGateCard");
    expect(main).toContain("StewardWorkbenchTodoSection");
    expect(main).toContain("StewardWorkbenchTtgStakeSection");
    expect(main).toContain("StewardWorkbenchL5CrossNav");
    expect(main).not.toContain("StewardWorkbenchFooter");
    const todoIdx = main.indexOf("<StewardWorkbenchTodoSection");
    const stakeIdx = main.indexOf("<StewardWorkbenchTtgStakeSection");
    expect(stakeIdx).toBeGreaterThan(0);
    expect(todoIdx).toBeGreaterThan(stakeIdx);
  });

  it("CN min stake aligns with protocol-ssot (400 bps → 400,000 TTG)", () => {
    expect(STEWARD_CN_PROTOCOL_MIN_STAKE_TTG).toBe(400_000);
    const protocol = formatProtocolStewardStakeTtgUnits("CN");
    expect(protocol?.replace(/,/g, "")).toBe("400000");
    const chainWei = BigInt("400000000000000000000000");
    expect(formatTtgAmount(chainWei, 18)).toBe("400,000");
  });

  it("smoke script exists and references vitest + steward-seat + playwright", () => {
    const smoke = read("../scripts/dev/smoke-steward-workbench-l5-local.sh");
    expect(smoke).toContain("stewardWorkbenchL5FullClosure.contract.test.ts");
    expect(smoke).toContain("/me/steward-seat");
    expect(smoke).toContain("steward-workbench-full-l5.spec.ts");
    expect(smoke).toContain("TT_STEWARD_WORKBENCH_L5_SMOKE: OK");
  });

  it("subpage back link component exists for steward workbench deep links", () => {
    expect(read("components/governance/StewardWorkbenchSubpageBackLink.tsx")).toContain(
      "data-tt-steward-subpage-back-workbench",
    );
    expect(read("app/governance/proposals/GovernanceProposalsPageMain.tsx")).toContain(
      "StewardWorkbenchSubpageBackLinkFromQuery",
    );
    expect(read("components/governance/StewardWorkbenchTodoSection.tsx")).toContain(
      "data-tt-steward-todo-create-proposal",
    );
    const create = read("app/governance/proposals/new/GovernanceProposalCreatePageMain.tsx");
    const detail = read("app/governance/proposals/[id]/GovernanceProposalDetailPageMain.tsx");
    expect(create).toContain("GovernanceProposalsSubpageNav");
    expect(detail).toContain("GovernanceProposalsSubpageNav");
  });

  it("closure probe constants are stable", () => {
    expect(STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE).toBe("steward-workbench-full-v1");
    expect(STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER).toBe("steward-workbench-l5-20260612");
  });
});
