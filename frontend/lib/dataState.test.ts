import { describe, expect, it } from "vitest";
import {
  deriveAuthGateDataState,
  deriveCommunitySocialStatsDataState,
  deriveListDataState,
  dataStateEmpty,
  dataStateError,
  dataStateInvalid,
  dataStateLoading,
  dataStateSuccess,
} from "./dataState";

describe("deriveListDataState", () => {
  it("prioritizes invalid over loading and error", () => {
    expect(
      deriveListDataState({
        invalid: true,
        invalidMessage: "bad",
        loading: true,
        error: "e",
        items: [1],
      }).kind
    ).toBe("invalid");
  });

  it("uses loading when not invalid", () => {
    expect(deriveListDataState({ loading: true, error: null, items: [] }).kind).toBe("loading");
  });

  it("uses error when loaded with message", () => {
    const s = deriveListDataState({ loading: false, error: "x", items: [1] });
    expect(s.kind).toBe("error");
    if (s.kind === "error") expect(s.message).toBe("x");
  });

  it("uses empty when no error and no items", () => {
    expect(deriveListDataState({ loading: false, error: null, items: [] }).kind).toBe("empty");
  });

  it("uses success when items exist", () => {
    const s = deriveListDataState({ loading: false, error: null, items: ["a"] });
    expect(s.kind).toBe("success");
    if (s.kind === "success") expect(s.value).toEqual(["a"]);
  });
});

describe("deriveAuthGateDataState", () => {
  it("loading while auth pending", () => {
    expect(deriveAuthGateDataState(true, false).kind).toBe("loading");
    expect(deriveAuthGateDataState(true, true).kind).toBe("loading");
  });

  it("invalid guest when resolved", () => {
    expect(deriveAuthGateDataState(false, false).kind).toBe("invalid");
  });

  it("success when logged in", () => {
    expect(deriveAuthGateDataState(false, true).kind).toBe("success");
  });
});

describe("deriveCommunitySocialStatsDataState", () => {
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

describe("factories", () => {
  it("builds discriminated unions", () => {
    expect(dataStateLoading()).toEqual({ kind: "loading" });
    expect(dataStateEmpty()).toEqual({ kind: "empty" });
    expect(dataStateError("m")).toEqual({ kind: "error", message: "m" });
    expect(dataStateInvalid()).toEqual({ kind: "invalid", message: undefined });
    expect(dataStateInvalid("z")).toEqual({ kind: "invalid", message: "z" });
    expect(dataStateSuccess(3)).toEqual({ kind: "success", value: 3 });
  });
});
