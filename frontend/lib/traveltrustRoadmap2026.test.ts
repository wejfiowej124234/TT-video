import { describe, expect, it } from "vitest";
import {
  assertTraveltrustRoadmap2026SchemaContract,
  listTraveltrustRoadmap2026Milestones,
  resolveTraveltrustRoadmapTargetLabel,
} from "./traveltrustRoadmap2026";

describe("traveltrustRoadmap2026", () => {
  it("passes schema contract", () => {
    expect(assertTraveltrustRoadmap2026SchemaContract()).toEqual([]);
  });

  it("lists two 2026 product milestones by sortOrder", () => {
    const items = listTraveltrustRoadmap2026Milestones();
    expect(items.length).toBe(2);
    expect(items[0]?.id).toBe("milestone-app-launch");
    expect(items[1]?.id).toBe("milestone-china-guides");
    expect(items.every((m) => m.targetLabelKey === "traveltrust_roadmap_target_2026_milestone")).toBe(true);
  });

  it("uses 2026 milestone target label when configured", () => {
    const app = listTraveltrustRoadmap2026Milestones().find((m) => m.id === "milestone-app-launch")!;
    const t = (key: string) =>
      ({
        traveltrust_roadmap_target_2026_milestone: "2026 里程碑",
      })[key] ?? key;
    expect(resolveTraveltrustRoadmapTargetLabel(app, t)).toBe("2026 里程碑");
  });

  it("keeps both milestones planned until ops marks progress", () => {
    const items = listTraveltrustRoadmap2026Milestones();
    expect(items.every((m) => m.status === "planned")).toBe(true);
  });
});
