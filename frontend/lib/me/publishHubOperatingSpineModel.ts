/**
 * 发布中心 operating spine · W1-B4（contextLabel · 产出总览）
 */
import {
  type ActiveWorkspaceContextId,
  normalizeStoredWorkspaceContext,
  readActiveWorkspaceContext,
  workspaceContextFromPublishHubIdentityParam,
  workspaceContextLabelKey,
} from "@/lib/header/activeWorkspaceContext";
import type { PublishHubRailFilter } from "@/lib/me/publishHubModel";
import { publishHubIdentityParamFromRailFilter } from "@/lib/me/publishHubWorkspaceContextSync";

export const PUBLISH_HUB_OPERATING_SPINE_I18N_KEY = "publish_hub_operating_spine" as const;

export const PUBLISH_HUB_OPERATING_SPINE_DATA_ATTR = "data-tt-publish-hub-operating-spine" as const;

export function publishHubOperatingContextFromPageState(opts: {
  filter: PublishHubRailFilter;
  urlIdentity: string | null | undefined;
  stored?: ActiveWorkspaceContextId;
  selectableIds: readonly ActiveWorkspaceContextId[];
}): ActiveWorkspaceContextId {
  if (opts.filter !== "all") {
    const identity = publishHubIdentityParamFromRailFilter(opts.filter);
    const fromFilter = workspaceContextFromPublishHubIdentityParam(identity);
    if (fromFilter && opts.selectableIds.includes(fromFilter)) return fromFilter;
  }

  const fromUrl = workspaceContextFromPublishHubIdentityParam(opts.urlIdentity);
  if (fromUrl && opts.selectableIds.includes(fromUrl)) return fromUrl;

  const stored = opts.stored ?? readActiveWorkspaceContext();
  return normalizeStoredWorkspaceContext(stored, opts.selectableIds);
}

export function publishHubOperatingSpineLine(
  context: ActiveWorkspaceContextId,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  return t(PUBLISH_HUB_OPERATING_SPINE_I18N_KEY, {
    contextLabel: t(workspaceContextLabelKey(context)),
  });
}
