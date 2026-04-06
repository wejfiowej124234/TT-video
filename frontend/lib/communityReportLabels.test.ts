import { describe, it, expect } from "vitest";
import {
  communityReportReasonLabel,
  communityReportStatusLabel,
  communityReportTargetTypeLabel,
} from "./communityReportLabels";

describe("communityReportLabels", () => {
  const t = (key: string) =>
    ({
      community_report_target_type_post: "Post",
      community_report_reason_spam: "Spam",
      community_report_status_open: "Open",
    }[key] ?? key);

  it("maps known target_type", () => {
    expect(communityReportTargetTypeLabel(t, "post")).toBe("Post");
  });

  it("falls back for unknown target_type", () => {
    expect(communityReportTargetTypeLabel(t, "unknown_xyz")).toBe("unknown_xyz");
  });

  it("maps reason and status", () => {
    expect(communityReportReasonLabel(t, "spam")).toBe("Spam");
    expect(communityReportStatusLabel(t, "open")).toBe("Open");
  });
});
