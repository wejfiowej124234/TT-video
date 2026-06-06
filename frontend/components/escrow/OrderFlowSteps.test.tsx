/**
 * 53-S11 / §六附续 §1：order.status + sub_status → 步骤条索引 单元测试
 * 与 53 附录 B（U3）映射表一致；无未知状态或空白。
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import OrderFlowSteps, { orderStateToStep } from "./OrderFlowSteps";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("orderStateToStep", () => {
  it("maps draft/created/open to step 1", () => {
    expect(orderStateToStep({ state: "Draft" })).toBe(1);
    expect(orderStateToStep({ state: "Created" })).toBe(1);
    expect(orderStateToStep({ state: "open" })).toBe(1);
    expect(orderStateToStep("draft")).toBe(1);
  });

  it("maps Created + guide_claimed to step 2", () => {
    expect(orderStateToStep({ state: "Created", sub_status: "guide_claimed" })).toBe(2);
  });

  it("maps Accepted + pending_bilateral to step 3", () => {
    expect(orderStateToStep({ state: "Accepted", sub_status: "pending_bilateral" })).toBe(3);
    expect(orderStateToStep({ state: "Accepted", sub_status: "guide_claimed" })).toBe(3);
    expect(orderStateToStep({ state: "Accepted" })).toBe(3);
  });

  it("maps Accepted + confirmed to step 4", () => {
    expect(orderStateToStep({ state: "Accepted", sub_status: "confirmed" })).toBe(4);
  });

  it("maps Escrowed to step 5", () => {
    expect(orderStateToStep({ state: "Escrowed" })).toBe(5);
    expect(orderStateToStep("escrowed")).toBe(5);
  });

  it("maps Completed (no rating) to step 6", () => {
    expect(orderStateToStep({ state: "Completed" })).toBe(6);
  });

  it("maps Completed + rating_pending to step 7", () => {
    expect(orderStateToStep({ state: "Completed", sub_status: "rating_pending" })).toBe(7);
  });

  it("maps Completed + rating_confirmed to step 8", () => {
    expect(orderStateToStep({ state: "Completed", sub_status: "rating_confirmed" })).toBe(8);
  });

  it("maps final/terminal states to step 8", () => {
    expect(orderStateToStep({ state: "Cancelled" })).toBe(8);
    expect(orderStateToStep({ state: "Disputed" })).toBe(8);
    expect(orderStateToStep({ state: "Refunded" })).toBe(8);
    expect(orderStateToStep("cancelled")).toBe(8);
  });

  it("uses status when state missing", () => {
    expect(orderStateToStep({ status: "accepted", sub_status: "confirmed" })).toBe(4);
  });

  it("returns 1 for unknown state", () => {
    expect(orderStateToStep({ state: "unknown" })).toBe(1);
    expect(orderStateToStep({})).toBe(1);
  });
});

describe("OrderFlowSteps component", () => {
  it("renders 8 steps (53-S1 eight-step flow)", () => {
    render(<OrderFlowSteps currentStep={4} variant="did" />);
    const nav = screen.getByRole("navigation", { name: "orderFlow_aria" });
    expect(nav).toBeTruthy();
    const items = within(nav).getAllByRole("listitem");
    expect(items.length).toBe(8);
    expect(nav.textContent).toContain("order_steps_step_draft");
    expect(nav.textContent).toContain("order_steps_step_release");
  });

  it("marks current step with aria-current=step and makes steps tabbable (37 §3.5)", () => {
    render(<OrderFlowSteps currentStep={3} />);
    const items = screen.getAllByRole("listitem");
    expect(items.every((li) => li.getAttribute("tabindex") === "0")).toBe(true);
    const current = items.filter((li) => li.getAttribute("aria-current") === "step");
    expect(current.length).toBe(1);
    expect(current[0]?.textContent).toContain("order_steps_step_bilateral");
  });

  it("marks completed steps in aria-label for screen readers (37 §3.5)", () => {
    render(<OrderFlowSteps currentStep={3} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]?.getAttribute("aria-label")).toContain("order_flow_step_completed_suffix");
    expect(items[1]?.getAttribute("aria-label")).toContain("order_flow_step_completed_suffix");
    expect(items[2]?.getAttribute("aria-label")).not.toContain("order_flow_step_completed_suffix");
  });

  it("moves focus between steps with ArrowRight / ArrowLeft / Home / End (37 §3.5)", () => {
    render(<OrderFlowSteps currentStep={4} />);
    const items = screen.getAllByRole("listitem");
    items[0]?.focus();
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(items[2]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1]!, { key: "End" });
    expect(document.activeElement).toBe(items[7]);
    fireEvent.keyDown(items[7]!, { key: "Home" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("experience draft step 2 shows pick-guide label when draftStep2Phase is pickGuide", () => {
    render(
      <OrderFlowSteps
        currentStep={1}
        variant="experience"
        compact
        draftJourneyStep={2}
        draftStep2Phase="pickGuide"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "order_flow_journey_aria" });
    expect(nav.textContent).toContain("order_flow_journey_pickGuide");
    expect(nav.textContent).not.toContain("order_flow_journey_confirm");
  });
});
