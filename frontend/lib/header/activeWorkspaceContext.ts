/**
 * Active Workspace Context · ② Wave 1A/1B（localStorage · SSR 安全）
 * SSOT：docs/adr/ADR-20260613-active-workspace-context-switcher.md
 */
import type { PublishHubIdentityQuery } from "@/lib/me/publishHubIdentityDefaultFilter";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import type { MeIdentitySlot } from "@/lib/meIdentitySlots";

export const ACTIVE_WORKSPACE_CONTEXT_STORAGE_KEY = "tt_active_workspace_context_v1" as const;

export const ACTIVE_WORKSPACE_CONTEXT_CHANGE_EVENT =
  "traveltrust:workspace-context-change" as const;

export const ACTIVE_WORKSPACE_CONTEXT_IDS = [
  "account",
  "guide",
  "merchant",
  "region_steward",
  "acquisition",
] as const;

export type ActiveWorkspaceContextId = (typeof ACTIVE_WORKSPACE_CONTEXT_IDS)[number];

export type ActiveWorkspaceContextOperatorId = Exclude<ActiveWorkspaceContextId, "account">;

export const DEFAULT_ACTIVE_WORKSPACE_CONTEXT: ActiveWorkspaceContextId = "account";

const OPERATOR_SLOT_IDS: readonly ActiveWorkspaceContextOperatorId[] = [
  "guide",
  "merchant",
  "acquisition",
  "region_steward",
];

const CONTEXT_TO_IDENTITY: Record<ActiveWorkspaceContextOperatorId, PublishHubIdentityQuery> = {
  guide: "guide",
  merchant: "merchant",
  acquisition: "acquisition",
  region_steward: "region_steward",
};

const IDENTITY_PARAM_TO_CONTEXT: Partial<
  Record<PublishHubIdentityQuery, ActiveWorkspaceContextOperatorId>
> = {
  guide: "guide",
  merchant: "merchant",
  acquisition: "acquisition",
  region_steward: "region_steward",
};

export function parseActiveWorkspaceContext(raw: unknown): ActiveWorkspaceContextId | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  return (ACTIVE_WORKSPACE_CONTEXT_IDS as readonly string[]).includes(v)
    ? (v as ActiveWorkspaceContextId)
    : null;
}

/** SSR / 首屏 hydration 缺省 */
export function getServerActiveWorkspaceContext(): ActiveWorkspaceContextId {
  return DEFAULT_ACTIVE_WORKSPACE_CONTEXT;
}

export function readActiveWorkspaceContext(): ActiveWorkspaceContextId {
  if (typeof window === "undefined") return getServerActiveWorkspaceContext();
  try {
    const parsed = parseActiveWorkspaceContext(
      window.localStorage.getItem(ACTIVE_WORKSPACE_CONTEXT_STORAGE_KEY),
    );
    return parsed ?? DEFAULT_ACTIVE_WORKSPACE_CONTEXT;
  } catch {
    return DEFAULT_ACTIVE_WORKSPACE_CONTEXT;
  }
}

export function writeActiveWorkspaceContext(id: ActiveWorkspaceContextId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_WORKSPACE_CONTEXT_STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(ACTIVE_WORKSPACE_CONTEXT_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeActiveWorkspaceContext(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key == null || e.key === ACTIVE_WORKSPACE_CONTEXT_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ACTIVE_WORKSPACE_CONTEXT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ACTIVE_WORKSPACE_CONTEXT_CHANGE_EVENT, onStoreChange);
  };
}

function operatorSlotSelectable(state: MeIdentitySlot["state"] | undefined): boolean {
  return state === "active" || state === "pending";
}

/** 顶栏 switcher：Account 总览 + active/pending operator 槽（ADR · 不含 traveler） */
export function listSelectableWorkspaceContexts(
  slots: MeIdentitySlot[] | null | undefined,
): ActiveWorkspaceContextId[] {
  const result: ActiveWorkspaceContextId[] = [DEFAULT_ACTIVE_WORKSPACE_CONTEXT];
  if (!slots?.length) return result;
  for (const id of OPERATOR_SLOT_IDS) {
    const slot = slots.find((s) => s.id === id);
    if (operatorSlotSelectable(slot?.state)) result.push(id);
  }
  return result;
}

export function normalizeStoredWorkspaceContext(
  stored: ActiveWorkspaceContextId,
  selectable: readonly ActiveWorkspaceContextId[],
): ActiveWorkspaceContextId {
  if (selectable.includes(stored)) return stored;
  return DEFAULT_ACTIVE_WORKSPACE_CONTEXT;
}

/** `?identity=` 深链 → workspace context；`traveler` 视为 account aggregate */
export function workspaceContextFromPublishHubIdentityParam(
  raw: string | null | undefined,
): ActiveWorkspaceContextId | null {
  const v = raw?.trim().toLowerCase();
  if (!v) return null;
  if (v === "traveler") return DEFAULT_ACTIVE_WORKSPACE_CONTEXT;
  const mapped = IDENTITY_PARAM_TO_CONTEXT[v as PublishHubIdentityQuery];
  return mapped ?? null;
}

export function workspaceContextToPublishHubIdentityParam(
  context: ActiveWorkspaceContextId,
): PublishHubIdentityQuery | null {
  if (context === "account") return null;
  return CONTEXT_TO_IDENTITY[context];
}

export function publishHubHrefForWorkspaceContext(context: ActiveWorkspaceContextId): string {
  const identity = workspaceContextToPublishHubIdentityParam(context);
  if (!identity) return PUBLISH_HUB_PATH;
  return `${PUBLISH_HUB_PATH}?identity=${identity}`;
}

/** URL `?identity=` 显式存在且合法时覆盖 localStorage（deep link 赢） */
export function resolveActiveWorkspaceContext(opts: {
  stored: ActiveWorkspaceContextId;
  urlIdentity: string | null | undefined;
  selectableIds: readonly ActiveWorkspaceContextId[];
}): ActiveWorkspaceContextId {
  const fromUrl = workspaceContextFromPublishHubIdentityParam(opts.urlIdentity);
  if (fromUrl && opts.selectableIds.includes(fromUrl)) return fromUrl;
  return normalizeStoredWorkspaceContext(opts.stored, opts.selectableIds);
}

export function workspaceContextLabelKey(id: ActiveWorkspaceContextId): string {
  if (id === "account") return "header_workspace_context_account";
  if (id === "guide") return "me_identity_slot_guide";
  if (id === "merchant") return "me_identity_slot_merchant";
  if (id === "acquisition") return "me_identity_slot_acquisition";
  return "me_identity_slot_region_steward";
}

export function shouldShowHeaderWorkspaceContextSwitcher(
  selectable: readonly ActiveWorkspaceContextId[],
): boolean {
  return selectable.length > 1;
}
