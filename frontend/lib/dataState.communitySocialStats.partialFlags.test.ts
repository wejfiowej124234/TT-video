import { describe, expect, it } from "vitest";
import { deriveCommunitySocialStatsDataState } from "./dataState";

describe("deriveCommunitySocialStatsDataState · partial & unknown flags", () => {
  const base = {
    errorMessage: "err",
    contractInvalidMessage: "inv",
  };

  it("excludes likes from empty/sum when includeLikesReceivedMetric is false", () => {
    const empty = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      socialStatsReady: true,
      followingCount: 0,
      followersCount: 0,
      friendsCount: 0,
      likesReceived: 99,
      includeLikesReceivedMetric: false,
    });
    expect(empty.kind).toBe("empty");
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      socialStatsReady: true,
      followingCount: 1,
      followersCount: 0,
      friendsCount: 0,
      likesReceived: 99,
      includeLikesReceivedMetric: false,
    });
    expect(s.kind).toBe("success");
    if (s.kind === "success") {
      expect(s.value.likesReceived).toBe(0);
      expect(s.value.followingCount).toBe(1);
    }
  });

  it("returns success with partialLoad when partialFailure and all counts zero", () => {
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      partialFailure: true,
      socialStatsReady: true,
      followingCount: 0,
      followersCount: 0,
      friendsCount: 0,
      likesReceived: 0,
    });
    expect(s.kind).toBe("success");
    if (s.kind === "success") {
      expect(s.value.partialLoad).toBe(true);
    }
  });

  it("marks partialLoad on success when partialFailure and some counts positive", () => {
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      partialFailure: true,
      socialStatsReady: true,
      followingCount: 2,
      followersCount: 0,
      friendsCount: 0,
      likesReceived: 0,
    });
    expect(s.kind).toBe("success");
    if (s.kind === "success") {
      expect(s.value.partialLoad).toBe(true);
      expect(s.value.followingCount).toBe(2);
    }
  });

  it("marks partialLoad and likesReceivedUnknown when contract invalid without network partial", () => {
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      partialFailure: false,
      likesReceivedUnknown: true,
      socialStatsReady: true,
      followingCount: 0,
      followersCount: 0,
      friendsCount: 0,
      likesReceived: 0,
    });
    expect(s.kind).toBe("success");
    if (s.kind === "success") {
      expect(s.value.partialLoad).toBe(true);
      expect(s.value.likesReceivedUnknown).toBe(true);
    }
  });

  it("does not treat all-zero as empty when likesReceivedUnknown", () => {
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      likesReceivedUnknown: true,
      socialStatsReady: true,
      followingCount: 0,
      followersCount: 0,
      friendsCount: 0,
      likesReceived: 0,
    });
    expect(s.kind).toBe("success");
  });

  it("marks partialLoad and followingCountUnknown when following list shape invalid", () => {
    const s = deriveCommunitySocialStatsDataState({
      ...base,
      statsLoading: false,
      statsError: false,
      socialStatsReady: true,
      followingCount: 0,
      followersCount: 1,
      friendsCount: 0,
      likesReceived: 0,
      followingCountUnknown: true,
    });
    expect(s.kind).toBe("success");
    if (s.kind === "success") {
      expect(s.value.partialLoad).toBe(true);
      expect(s.value.followingCountUnknown).toBe(true);
      expect(s.value.followersCount).toBe(1);
    }
  });
});
