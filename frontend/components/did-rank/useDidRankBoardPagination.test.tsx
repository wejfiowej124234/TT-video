import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { TravelerRankItem, GuideRankItem } from "@/lib/didRankTypes";
import { useDidRankBoardPagination } from "./useDidRankBoardPagination";

function mkT(i: number): TravelerRankItem {
  return {
    id: `t${i}`,
    rank: i,
    nickname: `n${i}`,
    totalSpentUsdt: 0,
    countriesCount: 0,
    citiesCount: 0,
  };
}

function mkG(i: number): GuideRankItem {
  return {
    id: `g${i}`,
    rank: i,
    nickname: `gn${i}`,
    totalAmountUsdt: 0,
    receptionCount: 0,
  };
}

describe("useDidRankBoardPagination", () => {
  it("keeps top 10 separate and slices 11+ for page 1", () => {
    const travelers = Array.from({ length: 25 }, (_, i) => mkT(i + 1));
    const guides = Array.from({ length: 12 }, (_, i) => mkG(i + 1));
    const { result } = renderHook(() =>
      useDidRankBoardPagination(travelers, guides, 1, 1, 20),
    );
    expect(result.current.topTravelers).toHaveLength(10);
    expect(result.current.topGuides).toHaveLength(10);
    expect(result.current.listTravelersFrom11).toHaveLength(15);
    expect(result.current.listGuidesFrom11).toHaveLength(2);
    expect(result.current.totalPagesTraveler).toBe(1);
    expect(result.current.paginatedTravelers).toHaveLength(15);
    expect(result.current.paginatedGuides).toHaveLength(2);
  });

  it("returns second page slice for ranks 11+", () => {
    const travelers = Array.from({ length: 45 }, (_, i) => mkT(i + 1));
    const guides: GuideRankItem[] = [];
    const { result } = renderHook(() =>
      useDidRankBoardPagination(travelers, guides, 2, 1, 20),
    );
    expect(result.current.listTravelersFrom11).toHaveLength(35);
    expect(result.current.paginatedTravelers).toHaveLength(15);
    expect(result.current.paginatedTravelers[0]?.id).toBe("t31");
  });
});
