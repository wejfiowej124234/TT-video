import { useState, useEffect, useId, useMemo } from "react";
import { COMMUNITY_FEED_TAG_QUERY_MAX_LEN } from "@/lib/apiClient/community";
import {
  communityTopicTagExceedsFeedQueryLimit,
  normalizeCommunityTopicTagFromSearchInput,
} from "@/lib/communityFeedSortUrl";
import type { CommunityFeedFilterBarProps } from "./communityFeedFilterBarTypes";

export function useCommunityFeedFilterBarChrome({
  feedTab,
  sortBy,
  typeFilter,
  regionFilter,
  destinationFilter,
  tagFilter,
  searchQuery,
  onSearchApplyServerTag,
}: CommunityFeedFilterBarProps) {
  const chipFiltersRegionId = useId();
  const searchTopicHintId = useId();
  const searchTopicLimitNoteId = useId();
  const searchTopicOverLimitId = useId();
  const normalizedTopicFromSearch = useMemo(
    () => normalizeCommunityTopicTagFromSearchInput(searchQuery),
    [searchQuery]
  );
  const topicTagOverApiLimit = communityTopicTagExceedsFeedQueryLimit(normalizedTopicFromSearch);
  const searchAriaDescribedBy = useMemo(() => {
    if (!onSearchApplyServerTag) return undefined;
    const parts = [searchTopicHintId, searchTopicLimitNoteId];
    if (topicTagOverApiLimit) parts.push(searchTopicOverLimitId);
    return parts.join(" ");
  }, [onSearchApplyServerTag, searchTopicHintId, searchTopicLimitNoteId, searchTopicOverLimitId, topicTagOverApiLimit]);
  const hasStreamContext = feedTab === "following" || sortBy === "hot";
  const hasActiveFilters =
    hasStreamContext ||
    destinationFilter !== "all" ||
    typeFilter !== "all" ||
    regionFilter !== "all" ||
    tagFilter !== null ||
    searchQuery.trim() !== "";

  const chipFiltersActive =
    typeFilter !== "all" ||
    regionFilter !== "all" ||
    destinationFilter !== "all" ||
    tagFilter !== null;

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  useEffect(() => {
    if (chipFiltersActive) setFiltersExpanded(true);
  }, [chipFiltersActive]);

  return {
    chipFiltersRegionId,
    searchTopicHintId,
    searchTopicLimitNoteId,
    searchTopicOverLimitId,
    topicTagOverApiLimit,
    searchAriaDescribedBy,
    hasActiveFilters,
    chipFiltersActive,
    filtersExpanded,
    setFiltersExpanded,
    COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  };
}
