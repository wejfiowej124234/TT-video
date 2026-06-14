"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchColdStartCampaignForSurface } from "./client";
import type { ColdStartCampaignPayload, ColdStartSurfaceId } from "./types";

export function coldStartCampaignQueryKey(surface: ColdStartSurfaceId) {
  return ["cold-start-campaign", surface] as const;
}

export function useColdStartCampaignSurface(surface: ColdStartSurfaceId) {
  const query = useQuery({
    queryKey: coldStartCampaignQueryKey(surface),
    queryFn: () => fetchColdStartCampaignForSurface(surface),
    staleTime: 60_000,
    retry: 1,
  });

  const campaign: ColdStartCampaignPayload | null = query.data?.campaign ?? null;
  const items = campaign?.items ?? [];

  return {
    surface,
    campaign,
    items,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
