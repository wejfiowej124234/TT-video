import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLISH_HUB_PHASE_A_ITEMS,
  PUBLISH_HUB_PHASE_A_SPRINT_MARKER,
} from "@/lib/me/publishHubPhaseAModel";
import {
  PUBLISH_HUB_PHASE_B_ITEMS,
  PUBLISH_HUB_PHASE_B_TASK_LIST_REL,
} from "@/lib/me/publishHubPhaseBModel";
import {
  PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS,
  PUBLISH_HUB_PHASE_TASK_LIST_REL,
} from "@/lib/me/publishHubPhaseL5ClosureModel";

const ROOT = process.cwd();

describe("publish hub phase task list SSOT", () => {
  const taskList = readFileSync(
    join(ROOT, "evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE-TASK-LIST.md"),
    "utf8",
  );

  it("task list declares phase discipline and L5 closure gap", () => {
    expect(taskList).toContain("① 本地 → ② 测试网 → ③ 公网/生产");
    expect(taskList).toContain("PH-A-9");
    expect(taskList).toContain("PH-B-1");
    expect(taskList).toContain("L5 级 ACTIVE 收口");
    expect(taskList).toContain("G-1/G-2");
    expect(taskList).toContain("不再在 ① 新增");
    expect(taskList).toContain("ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT");
  });

  it("Wave1 sprint prepared with ① local + ②③ phased backlog", () => {
    const wave1 = readFileSync(
      join(ROOT, "evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md"),
      "utf8",
    );
    expect(wave1).toContain("G-1/G-2");
    expect(wave1).toContain("W1-A1");
    expect(wave1).toContain("W1-P1");
    expect(wave1).toContain("ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE");
    expect(taskList).toContain("smoke-publish-hub-staging.sh");
  });

  it("Phase A MVP items are active in machine model", () => {
    expect(PUBLISH_HUB_PHASE_A_SPRINT_MARKER).toBe("publish-hub-phase-a-20260612");
    expect(PUBLISH_HUB_PHASE_A_ITEMS.every((i) => i.status === "active")).toBe(true);
    expect(PUBLISH_HUB_PHASE_A_ITEMS.some((i) => i.id === "PH-A-8")).toBe(true);
  });

  it("Phase B items are backlog until Phase ② starts", () => {
    expect(PUBLISH_HUB_PHASE_B_TASK_LIST_REL).toBe(PUBLISH_HUB_PHASE_TASK_LIST_REL);
    expect(PUBLISH_HUB_PHASE_B_ITEMS.every((i) => i.status === "backlog")).toBe(true);
    expect(PUBLISH_HUB_PHASE_B_ITEMS.some((i) => i.id === "PH-B-1")).toBe(true);
    expect(PUBLISH_HUB_PHASE_B_ITEMS.some((i) => i.id === "PH-B-10")).toBe(true);
  });

  it("L5 closure items A-9～A-16 + IA freeze closed; A-14 optional backlog", () => {
    const closed = PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS.filter((i) => i.status === "closed");
    expect(closed.some((i) => i.id === "PH-A-9")).toBe(true);
    expect(closed.some((i) => i.id === "PH-A-13")).toBe(true);
    expect(closed.some((i) => i.id === "PH-A-16")).toBe(true);
    expect(closed.some((i) => i.id === "PH-IA-FREEZE")).toBe(true);
    expect(PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS.find((i) => i.id === "PH-A-14")?.status).toBe("backlog");
    expect(taskList).toContain("publishHubL5FullClosure");
    expect(taskList).toContain("PUBLISH-HUB-PHASE1-CLOSURE.md");
    expect(taskList).toContain("PUBLISH-HUB-IA-BOUNDARY-SCORE.md");
  });
});
