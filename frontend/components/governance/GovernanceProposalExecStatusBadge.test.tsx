import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GovernanceProposalExecStatusBadge, {
  governanceProposalExecStatusI18nKey,
} from "./GovernanceProposalExecStatusBadge";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("governanceProposalExecStatusI18nKey", () => {
  it("maps known Governor labels to i18n keys", () => {
    expect(governanceProposalExecStatusI18nKey("pending")).toBe("governance_proposal_exec_status_pending");
    expect(governanceProposalExecStatusI18nKey("ACTIVE")).toBe("governance_proposal_exec_status_active");
    expect(governanceProposalExecStatusI18nKey("executed")).toBe("governance_proposal_exec_status_executed");
  });

  it("normalizes cancelled spelling to canceled key", () => {
    expect(governanceProposalExecStatusI18nKey("cancelled")).toBe("governance_proposal_exec_status_canceled");
  });

  it("falls back to unknown", () => {
    expect(governanceProposalExecStatusI18nKey("weird")).toBe("governance_proposal_exec_status_unknown");
  });
});

describe("GovernanceProposalExecStatusBadge", () => {
  it("renders nothing when loading", () => {
    const { container } = render(
      <GovernanceProposalExecStatusBadge loading fetchSettled={false} entry={{ state: "ok", status: "active", is_chain_ssot: true }} />,
    );
    expect(container.textContent).toBe("");
  });

  it("renders status pill with variant classes for active", () => {
    render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{ state: "ok", status: "active", is_chain_ssot: true }}
      />,
    );
    const pill = screen.getByText("governance_proposal_exec_status_active");
    expect(pill.className).toContain("border-travel-500");
    expect(screen.getByText("governance_proposals_exec_ssot_badge")).toBeTruthy();
    expect(screen.getByText("governance_exec_shared_readonly_caption")).toBeTruthy();
  });

  it("renders succeeded with emerald styling", () => {
    render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{ state: "ok", status: "succeeded", is_chain_ssot: true }}
      />,
    );
    const pill = screen.getByText("governance_proposal_exec_status_succeeded");
    expect(pill.className).toContain("border-emerald-500");
    expect(screen.getByText("governance_proposals_exec_ssot_badge")).toBeTruthy();
  });

  it("shows list Queued hint using shared narrative key (A-08)", () => {
    render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{ state: "ok", status: "queued", is_chain_ssot: true }}
      />,
    );
    expect(screen.getByText("governance_exec_shared_list_queued_hint")).toBeTruthy();
  });

  it("shows projection note when not chain SSOT and no data_source", () => {
    render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{ state: "ok", status: "queued", is_chain_ssot: false }}
      />,
    );
    expect(screen.getByText("governance_proposal_exec_status_queued")).toBeTruthy();
    expect(screen.getByText("governance_proposals_status_projection_note")).toBeTruthy();
    expect(screen.getByText("governance_exec_shared_readonly_caption")).toBeTruthy();
  });

  /** A-03.1：ok 态须二选一标出来源（链上 SSOT 徽章 / 投影徽章）；zh 下分别为「链上」「投影」文案 */
  it("ok entry always shows chain SSOT badge or projection badge (no unlabeled source)", () => {
    const { unmount } = render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{ state: "ok", status: "active", is_chain_ssot: true }}
      />,
    );
    expect(screen.getByText("governance_proposals_exec_ssot_badge")).toBeTruthy();
    expect(screen.queryByText("governance_proposals_status_projection_note")).toBeNull();
    unmount();

    render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{ state: "ok", status: "active", is_chain_ssot: false }}
      />,
    );
    expect(screen.getByText("governance_proposals_status_projection_note")).toBeTruthy();
    expect(screen.queryByText("governance_proposals_exec_ssot_badge")).toBeNull();
  });

  it("shows API data_source chip when projection returns it", () => {
    render(
      <GovernanceProposalExecStatusBadge
        loading={false}
        fetchSettled
        entry={{
          state: "ok",
          status: "active",
          is_chain_ssot: false,
          data_source: "governance_proposals_projection",
          note: "read_error hint",
        }}
      />,
    );
    expect(screen.getByText("governance_proposal_exec_status_active")).toBeTruthy();
    expect(screen.getByText("governance_proposals_status_projection_note")).toBeTruthy();
    expect(screen.getByText("governance_proposals_projection")).toBeTruthy();
    const chip = screen.getByTitle("read_error hint");
    expect(chip.textContent).toContain("governance_proposals_projection");
  });

  it("list variant hides projection chips and audit captions", () => {
    render(
      <GovernanceProposalExecStatusBadge
        variant="list"
        loading={false}
        fetchSettled
        entry={{
          state: "ok",
          status: "active",
          is_chain_ssot: false,
          data_source: "governance_proposals_projection",
        }}
      />,
    );
    expect(screen.getByText("governance_proposal_exec_status_active")).toBeTruthy();
    expect(screen.queryByText("governance_proposals_projection")).toBeNull();
    expect(screen.queryByText("governance_exec_shared_readonly_caption")).toBeNull();
  });

  it("renders error line when settled and entry is error", () => {
    render(
      <GovernanceProposalExecStatusBadge loading={false} fetchSettled entry={{ state: "error" }} />,
    );
    expect(screen.getByText("governance_proposals_status_error")).toBeTruthy();
  });

  it("renders error when settled but entry missing", () => {
    render(<GovernanceProposalExecStatusBadge loading={false} fetchSettled entry={undefined} />);
    expect(screen.getByText("governance_proposals_status_error")).toBeTruthy();
  });
});
