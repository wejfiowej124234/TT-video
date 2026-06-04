export const ADMIN_POLICY_PUBLISH_STATUSES = ["draft", "active", "deprecated"] as const;
export type AdminPolicyPublishStatus = (typeof ADMIN_POLICY_PUBLISH_STATUSES)[number];

export const POLICY_CODE_MAX = 256;
export const SCOPE_TYPE_MAX = 64;
export const BINDING_ROLE_MAX = 128;
export const POLICY_STATUS_URL = new Set(["draft", "active", "deprecated"]);
