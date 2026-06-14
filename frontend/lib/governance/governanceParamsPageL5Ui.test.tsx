import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GovernanceParamsPercentBar } from "./governanceParamsPageL5Ui";

describe("GovernanceParamsPercentBar a11y", () => {
  it("exposes meter semantics with value", () => {
    render(<GovernanceParamsPercentBar label="Country bucket" value={45} />);
    const meter = screen.getByRole("meter", { name: /Country bucket/i });
    expect(meter.getAttribute("aria-valuenow")).toBe("45");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
  });
});
