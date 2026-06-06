import { describe, expect, it } from "vitest";

import {
  onboardingCircledStep,
  onboardingProgressConnectorClass,
  onboardingProgressConnectorHorizontalClass,
  onboardingStepBadgeClass,
  onboardingStepBadgeLabel,
} from "@/lib/onboarding/onboardingStepIndex";

describe("onboardingStepIndex", () => {
  it("maps circled digits for aria labels", () => {
    expect(onboardingCircledStep(1)).toBe("①");
    expect(onboardingCircledStep(2)).toBe("②");
    expect(onboardingCircledStep(3)).toBe("③");
  });

  it("uses checkmark for done badges and numerals for active/pending", () => {
    expect(onboardingStepBadgeLabel(1, "done")).toBe("✓");
    expect(onboardingStepBadgeLabel(2, "active")).toBe("2");
    expect(onboardingStepBadgeLabel(3, "pending")).toBe("3");
  });

  it("keeps done badge classes distinct from active and pending", () => {
    const done = onboardingStepBadgeClass("done", "auth");
    const active = onboardingStepBadgeClass("active", "auth");
    expect(done).toContain("bg-ref-sun");
    expect(active).toContain("bg-ref-sun");
    expect(active).toContain("shadow-");
    expect(done).not.toContain("shadow-[");
    expect(onboardingStepBadgeClass("pending", "auth")).toContain("border-2");
  });

  it("styles progress connectors for done vs pending segments", () => {
    expect(onboardingProgressConnectorClass(true, "auth")).toContain("bg-ref-sun");
    expect(onboardingProgressConnectorClass(false, "console")).toContain("bg-ink");
    expect(onboardingProgressConnectorHorizontalClass(true, "auth")).toContain("bg-ref-sun");
  });
});
