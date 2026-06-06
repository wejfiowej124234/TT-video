/** 70 Admin 最小收口（路径段）；由 `routes.ts` 聚合；实现拆分为 `routesAdminCore` / `routesAdminCommunityPolicies` / `routesAdminPlatformOps`。 */
import { routesAdminCore } from "./routesAdminCore";
import { routesAdminCommunityPolicies } from "./routesAdminCommunityPolicies";
import { routesAdminOnboarding } from "./routesAdminOnboarding";
import { routesAdminPlatformOps } from "./routesAdminPlatformOps";

export const routesAdmin = {
  ...routesAdminCore,
  ...routesAdminCommunityPolicies,
  ...routesAdminOnboarding,
  ...routesAdminPlatformOps,
} as const;
