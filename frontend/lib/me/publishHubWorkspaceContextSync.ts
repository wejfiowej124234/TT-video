/**
 * 发布中心 ↔ Workspace Context 三向同步（W1-B2 · ① 本地 · ② staging 同形）
 */
import {
  type ActiveWorkspaceContextId,
  DEFAULT_ACTIVE_WORKSPACE_CONTEXT,
  normalizeStoredWorkspaceContext,
  workspaceContextFromPublishHubIdentityParam,
  workspaceContextToPublishHubIdentityParam,
} from "@/lib/header/activeWorkspaceContext";
import { PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";
import type { PublishHubRailFilter } from "@/lib/me/publishHubModel";
import {
  publishHubFilterFromIdentityParam,
  type PublishHubIdentityQuery,
} from "@/lib/me/publishHubIdentityDefaultFilter";

export const PUBLISH_HUB_WORKSPACE_CONTEXT_URL_WINS_TOAST_KEY =
  "publish_hub_workspace_context_url_wins" as const;

export const PUBLISH_HUB_WORKSPACE_CONTEXT_TOAST_DATA_ATTR =
  "data-tt-publish-hub-workspace-context-toast" as const;

const RAIL_TO_IDENTITY: Record<Exclude<PublishHubRailFilter, "all">, PublishHubIdentityQuery> = {
  trip: "traveler",
  guide: "guide",
  merchant: "merchant",
  acquisition: "acquisition",
  governance: "region_steward",
};

export function publishHubIdentityParamFromRailFilter(
  filter: PublishHubRailFilter,
): PublishHubIdentityQuery | null {
  if (filter === "all") return null;
  return RAIL_TO_IDENTITY[filter];
}

export function publishHubFilterFromWorkspaceContext(
  context: ActiveWorkspaceContextId,
): PublishHubRailFilter | null {
  const identity = workspaceContextToPublishHubIdentityParam(context);
  if (!identity) return null;
  return publishHubFilterFromIdentityParam(identity);
}

export function detectWorkspaceContextUrlConflict(opts: {
  stored: ActiveWorkspaceContextId;
  urlIdentity: string | null | undefined;
  selectableIds: readonly ActiveWorkspaceContextId[];
}): boolean {
  const urlContext = workspaceContextFromPublishHubIdentityParam(opts.urlIdentity);
  if (!urlContext) return false;
  const storedNorm = normalizeStoredWorkspaceContext(opts.stored, opts.selectableIds);
  if (storedNorm === DEFAULT_ACTIVE_WORKSPACE_CONTEXT) return false;
  return urlContext !== storedNorm;
}

export type PublishHubWorkspaceContextUrlPatch = {
  href: string;
  context: ActiveWorkspaceContextId;
};

/** 筛选 chip / context switcher → URL `?identity=` + localStorage context */
export function publishHubUrlAndContextForFilter(
  filter: PublishHubRailFilter,
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
): PublishHubWorkspaceContextUrlPatch {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("filter");
  params.delete("rail");

  if (filter === "all") {
    params.delete("identity");
    const qs = params.toString();
    return {
      href: qs ? `${pathname}?${qs}` : pathname,
      context: DEFAULT_ACTIVE_WORKSPACE_CONTEXT,
    };
  }

  const identity = publishHubIdentityParamFromRailFilter(filter);
  if (identity) params.set("identity", identity);
  else params.delete("identity");

  const qs = params.toString();
  const context =
    workspaceContextFromPublishHubIdentityParam(identity) ?? DEFAULT_ACTIVE_WORKSPACE_CONTEXT;

  return {
    href: qs ? `${pathname}?${qs}` : pathname,
    context,
  };
}

export type PublishHubWorkspaceContextInit = {
  filter: PublishHubRailFilter | null;
  urlConflict: boolean;
  /** 无 URL identity 时由 stored context 补写 query */
  applyUrlIdentity: PublishHubIdentityQuery | null;
};

/** 无 `?filter=` / `?identity=` 时：stored operator context → 默认轨 + 补 URL */
export function resolvePublishHubWorkspaceContextInit(opts: {
  stored: ActiveWorkspaceContextId;
  urlIdentity: string | null | undefined;
  selectableIds: readonly ActiveWorkspaceContextId[];
}): PublishHubWorkspaceContextInit {
  const fromIdentity = publishHubFilterFromIdentityParam(opts.urlIdentity);
  if (fromIdentity) {
    return {
      filter: fromIdentity,
      urlConflict: detectWorkspaceContextUrlConflict({
        stored: opts.stored,
        urlIdentity: opts.urlIdentity,
        selectableIds: opts.selectableIds,
      }),
      applyUrlIdentity: null,
    };
  }

  const storedNorm = normalizeStoredWorkspaceContext(opts.stored, opts.selectableIds);
  const fromStored = publishHubFilterFromWorkspaceContext(storedNorm);
  if (fromStored) {
    return {
      filter: fromStored,
      urlConflict: false,
      applyUrlIdentity: workspaceContextToPublishHubIdentityParam(storedNorm),
    };
  }

  return { filter: null, urlConflict: false, applyUrlIdentity: null };
}

export function publishHubPathWithIdentity(identity: PublishHubIdentityQuery): string {
  return `${PUBLISH_HUB_PATH}?identity=${identity}`;
}
