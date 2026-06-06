import { describe, expect, it } from "vitest";
import { deriveCommunitySocialStatsDataState } from "./dataState";

describe("deriveCommunitySocialStatsDataState · kind transitions", () => {
  const base = {
    errorMessage: "err",
    contractInvalidMessage: "inv",
  };

  it("prioritizes error over loading", () => {
    expect(
      deriveCommunitySocialStatsDataState({
        ...base,
        statsLoading: true,
        statsError: true,
        socialStatsReady: false,
        followingCount: 0,
        followersCount: 0,
        friendsCount: 0,
        likesReceived: 0,
      }).kind
    ).toBe("error");
  });

  it("uses loading while pending", () => {
    expect(
      deriveCommunitySocialStatsDataState({
        ...base,
        statsLoading: true,
        statsError: false,
        socialStatsReady: false,
        followingCount: 0,
        followersCount: 0,
        friendsCount: 0,
        likesReceived: 0,
      }).kind
    ).toBe("loading");
  });

  it("uses invalid when settled without ready and no error", () => {
    expect(
      deriveCommunitySocialStatsDataState({
        ...base,
        statsLoading: false,
        statsError: false,
        socialStatsReady: false,
        followingCount: 0,
        followersCount: 0,
        friendsCount: 0,
        likesReceived: 0,
      }).kind
    ).toBe("invalid");
  });

  it("uses empty when ready and all counts zero", () => {
    expect(
      deriveCommunitySocialStatsDataState({
        ...base,
        statsLoading: false,
        statsError: false,
        socialStatsReady: true,
        followingCount: 0,
        followersCount: 0,
        friendsCount: 0,
        likesReceived: 0,
      }).kind
    ).toBe("empty");
  });

  it("uses success when any count positive", () => {
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      socialStatsReady: true,
      followingCount: 0,
      followersCount: 1,
      friendsCount: 0,
      likesReceived: 0,
    });
    expect(s.kind).toBe("success");
    if (s.kind === "success") expect(s.value.followersCount).toBe(1);
  });
});
