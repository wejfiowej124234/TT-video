import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";

export function useAdminConfigHubPage() {
  return useAdminMetaBuildFromPublicMeta("AdminConfigHubMetaBuild");
}
