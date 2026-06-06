import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { CommunityInteractionSummary } from "./CommunityInteractionSummary";

const noopT = (k: string) => k;

function renderSummary(ui: React.ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("CommunityInteractionSummary", () => {
  it("shows loading when authPending", () => {
    renderSummary(
      <CommunityInteractionSummary
        t={noopT}
        isLoggedIn={false}
        authPending
        likesReceived={0}
        likesLoading={false}
        likesError={false}
        loginReturnPath="/community/activity"
      />,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("common_loading")).toBeTruthy();
  });

  it("prioritizes likesMetricDisabledByConfig over error", () => {
    renderSummary(
      <CommunityInteractionSummary
        t={noopT}
        isLoggedIn
        authPending={false}
        likesReceived={99}
        likesLoading={false}
        likesError
        likesMetricDisabledByConfig
        loginReturnPath="/community/activity"
      />,
    );
    expect(screen.getByText("community_me_likes_list_disabled_by_config")).toBeTruthy();
    expect(screen.queryByText("community_activity_likes_load_failed")).toBeNull();
  });

  it("shows suppressed state with CTA to /community/me", () => {
    renderSummary(
      <CommunityInteractionSummary
        t={noopT}
        isLoggedIn
        authPending={false}
        likesReceived={42}
        likesLoading={false}
        likesError={false}
        likesMetricSuppressed
        loginReturnPath="/community/activity"
      />,
    );
    expect(screen.getByText("community_likes_metric_suppressed_hint")).toBeTruthy();
    const link = screen.getByRole("link", { name: "community_likes_metric_suppressed_cta_me" });
    expect(link.getAttribute("href")).toBe("/me/settings/profile");
  });

  it("shows likesErrorMessage when likesError (e.g. contract invalid)", () => {
    renderSummary(
      <CommunityInteractionSummary
        t={noopT}
        isLoggedIn
        authPending={false}
        likesReceived={0}
        likesLoading={false}
        likesError
        likesErrorMessage="community_me_social_stats_contract_invalid"
        loginReturnPath="/community/activity"
        onRetryLikes={() => {}}
      />,
    );
    expect(screen.getByText("community_me_social_stats_contract_invalid")).toBeTruthy();
    expect(screen.getByRole("button", { name: "common_retry" })).toBeTruthy();
  });

  it("shows success count and posts CTA when loaded", () => {
    renderSummary(
      <CommunityInteractionSummary
        t={noopT}
        isLoggedIn
        authPending={false}
        likesReceived={7}
        likesLoading={false}
        likesError={false}
        loginReturnPath="/community/activity"
      />,
    );
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByRole("link", { name: "community_activity_likes_cta_posts" })).toBeTruthy();
  });
});
