/**
 * Workspace Context ↔ 经营工作台 deep link（W1-B3 · ADR-20260613）
 */
import type { ActiveWorkspaceContextId } from "@/lib/header/activeWorkspaceContext";
import {
  ACQUISITION_WORKSPACE_HREF,
  GUIDE_WORKSPACE_HREF,
  MERCHANT_WORKSPACE_HREF,
  STEWARD_WORKSPACE_HREF,
  workspaceSurfaceById,
  type WorkspaceIdentityId,
} from "@/lib/workspace/workspaceIdentityModel";

export const OPERATOR_WORKBENCH_ENTRY_PATHS = [
  GUIDE_WORKSPACE_HREF.split("?")[0]!,
  MERCHANT_WORKSPACE_HREF,
  ACQUISITION_WORKSPACE_HREF.split("?")[0]!,
  STEWARD_WORKSPACE_HREF.split("?")[0]!,
] as const;

export function workspaceIdentityIdFromContext(
  context: ActiveWorkspaceContextId,
): WorkspaceIdentityId | null {
  if (context === "account") return null;
  return context;
}

export function workbenchHrefForWorkspaceContext(
  context: ActiveWorkspaceContextId,
): string | null {
  const id = workspaceIdentityIdFromContext(context);
  if (!id) return null;
  return workspaceSurfaceById(id).workbenchHref;
}

export function workbenchPathnameFromHref(href: string): string {
  return href.split("?")[0] ?? href;
}

/** 当前 pathname + search 是否已在目标 workbench（含 steward `?view=region`） */
export function workbenchLocationMatchesTarget(
  pathname: string,
  search: string,
  targetHref: string,
): boolean {
  const targetPath = workbenchPathnameFromHref(targetHref);
  if (pathname !== targetPath && !pathname.startsWith(`${targetPath}/`)) return false;
  const query = targetHref.includes("?") ? targetHref.slice(targetHref.indexOf("?") + 1) : "";
  if (!query) return true;
  const expected = new URLSearchParams(query);
  const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [key, value] of expected.entries()) {
    if (current.get(key) !== value) return false;
  }
  return true;
}

export function isOperatorWorkbenchPathname(pathname: string): boolean {
  return OPERATOR_WORKBENCH_ENTRY_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 在 operator 工作台域内且与当前 context 不一致时，返回应 redirect 的 workbench href。
 * `account` context 不强制跳转。
 */
export function resolveOperatorWorkbenchRedirect(
  pathname: string,
  search: string,
  context: ActiveWorkspaceContextId,
): string | null {
  if (context === "account") return null;
  const target = workbenchHrefForWorkspaceContext(context);
  if (!target) return null;
  if (workbenchLocationMatchesTarget(pathname, search, target)) return null;
  if (!isOperatorWorkbenchPathname(pathname)) return null;
  return target;
}

export function meSettingsWorkbenchItemIdForContext(
  context: ActiveWorkspaceContextId,
): string | null {
  switch (context) {
    case "guide":
      return "guide_hub";
    case "merchant":
      return "merchant_hub";
    case "region_steward":
      return "steward_hub";
    case "acquisition":
      return "acquisition_hub";
    default:
      return null;
  }
}

export function reorderNavItemsForWorkspaceContext<T extends { id: string }>(
  items: T[],
  context: ActiveWorkspaceContextId,
): T[] {
  const primaryId = meSettingsWorkbenchItemIdForContext(context);
  if (!primaryId) return items;
  const idx = items.findIndex((item) => item.id === primaryId);
  if (idx <= 0) return items;
  const next = [...items];
  const [primary] = next.splice(idx, 1);
  next.unshift(primary!);
  return next;
}
