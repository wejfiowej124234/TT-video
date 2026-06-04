export const PUBLISH_STATUSES = ["draft", "active", "sunset"] as const;

export const TENANT_KEY_MAX = 256;
export const REGION_MAX = 128;

export const TENANT_SCOPE_STATUSES = new Set<string>(["draft", "active", "sunset"]);
export const TENANT_SCOPE_CLASSES = new Set<string>(["data_residency", "ops", "feature", "network"]);
