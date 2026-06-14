import { apiUrl } from "@/lib/api";
import { fetchJsonWithApiStatusLog, getAuthHeaders } from "@/lib/apiClient/core";
import {
  parsePublishHubServerSummaryPayload,
  type PublishHubServerSummaryCounts,
} from "@/lib/me/publishHubServerSummaryModel";

const ME_PUBLISH_SUMMARY_PATH = "/api/v1/me/publish-summary";

export async function getMePublishSummary(): Promise<PublishHubServerSummaryCounts | null> {
  const { body: payload } = await fetchJsonWithApiStatusLog<unknown>(
    "me.getMePublishSummary",
    apiUrl(ME_PUBLISH_SUMMARY_PATH),
    { headers: getAuthHeaders() },
  );
  return parsePublishHubServerSummaryPayload(payload);
}
