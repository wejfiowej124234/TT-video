import { describe, expect, it } from "vitest";

import {
  STEWARD_ADMISSION_WORKBENCH_HREF,
  stewardAdmissionWorkbenchHref,
} from "@/lib/steward/stewardAdmissionNav";

describe("stewardAdmissionNav", () => {
  it("builds workbench admission anchor href", () => {
    expect(STEWARD_ADMISSION_WORKBENCH_HREF).toBe(
      "/governance?view=region#steward-b-track-admission",
    );
    expect(stewardAdmissionWorkbenchHref("identities_hub")).toBe(
      "/governance?view=region&from=identities_hub#steward-b-track-admission",
    );
  });
});
