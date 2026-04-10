import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import GovernanceProposalExecutionActionsSkeleton from "./GovernanceProposalExecutionActionsSkeleton";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("GovernanceProposalExecutionActionsSkeleton", () => {
  it("surfaces limits and risk copy beside skeleton actions (A-07 / A-08 shared keys)", () => {
    render(<GovernanceProposalExecutionActionsSkeleton readiness={{ kind: "executable", sourceState: "queued" }} />);
    expect(screen.getByLabelText("governance_exec_actions_limits_aria")).toBeTruthy();
    expect(screen.getByText("governance_exec_actions_limits_heading")).toBeTruthy();
    expect(screen.getByText("governance_exec_shared_limits_skeleton")).toBeTruthy();
    expect(screen.getByText("governance_exec_shared_queued_explanation")).toBeTruthy();
  });

  it("limits aside skips Queued paragraph when not in queued readiness bucket", () => {
    render(<GovernanceProposalExecutionActionsSkeleton readiness={{ kind: "executed", sourceState: "executed" }} />);
    expect(screen.getByText("governance_exec_shared_limits_skeleton")).toBeTruthy();
    expect(screen.queryByText("governance_exec_shared_queued_explanation")).toBeNull();
  });

  it("enables execute button when readiness is queued bucket", () => {
    render(<GovernanceProposalExecutionActionsSkeleton readiness={{ kind: "executable", sourceState: "queued" }} />);
    const exec = screen.getByRole("button", { name: "governance_exec_action_execute_label" }) as HTMLButtonElement;
    const queue = screen.getByRole("button", { name: "governance_exec_action_queue_label" }) as HTMLButtonElement;
    expect(exec.disabled).toBe(false);
    expect(queue.disabled).toBe(true);
    fireEvent.click(exec);
    expect(screen.getByText("governance_exec_action_placeholder_ack")).toBeTruthy();
  });

  it("enables queue button when succeeded before timelock", () => {
    render(
      <GovernanceProposalExecutionActionsSkeleton readiness={{ kind: "before_timelock", sourceState: "Succeeded" }} />,
    );
    const queue = screen.getByRole("button", { name: "governance_exec_action_queue_label" }) as HTMLButtonElement;
    const exec = screen.getByRole("button", { name: "governance_exec_action_execute_label" }) as HTMLButtonElement;
    expect(queue.disabled).toBe(false);
    expect(exec.disabled).toBe(true);
  });

  it("disables both when executed", () => {
    render(<GovernanceProposalExecutionActionsSkeleton readiness={{ kind: "executed", sourceState: "executed" }} />);
    expect((screen.getByRole("button", { name: "governance_exec_action_queue_label" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("button", { name: "governance_exec_action_execute_label" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
