/**
 * Multi-Identity Workspace · 五槽路由旁证
 * **Definition SSOT（应然 · ACTIVE · CONFIRMED）：**
 * `frontend/evidence/GO_local_identity_workspace/WORKSPACE-DEFINITION-SSOT.v1.md`
 */

export const WORKSPACE_SPRINT_MARKER = "multi-identity-workspace-sprint-v1" as const;

export type WorkspaceIdentityId =
  | "traveler"
  | "guide"
  | "merchant"
  | "region_steward"
  | "acquisition";

export type WorkspaceSurface = {
  id: WorkspaceIdentityId;
  /** 经营工作台（operator）；旅行者无独立工作台 */
  workbenchHref: string | null;
  /** 入驻/申请 */
  applyHref: string;
  /** 身份 settings（P2 已闭） */
  settingsHref: string;
  /** 公开/子站面（发现·挂牌） */
  publicSurfaceHref: string | null;
  /** users.role 或槽位 id 对读 */
  roleOrSlot: string;
};

export const MERCHANT_WORKSPACE_HREF = "/provider" as const;
export const GUIDE_WORKSPACE_HREF = "/guide" as const;
export const ACQUISITION_WORKSPACE_HREF = "/market/acquisition" as const;
export const ACQUISITION_PUBLIC_HREF = "/market/acquisition" as const;
export const MERCHANT_PUBLIC_HREF = "/market/provider" as const;
/** 商家橱窗创作台深链（`?studio=1` 进页自动打开 Studio） */
export const MERCHANT_STUDIO_HREF = "/market/provider?studio=1" as const;
/** 收购 Studio 深链 */
export const ACQUISITION_STUDIO_HREF = "/market/acquisition?studio=1" as const;
export const STEWARD_WORKSPACE_HREF = "/governance?view=region" as const;
export const STEWARD_GOVERNANCE_HREF = "/governance" as const;
export const TRAVELER_ORDERS_HREF = "/orders" as const;
export const IDENTITY_HUB_HREF = "/me/identities" as const;

export const WORKSPACE_SURFACES: readonly WorkspaceSurface[] = [
  {
    id: "traveler",
    workbenchHref: null,
    applyHref: "/auth/register",
    settingsHref: "/me/settings/profile",
    publicSurfaceHref: "/community",
    roleOrSlot: "traveler",
  },
  {
    id: "guide",
    workbenchHref: GUIDE_WORKSPACE_HREF,
    applyHref: "/guide/register",
    settingsHref: "/me/identities/guide/settings",
    publicSurfaceHref: "/guides",
    roleOrSlot: "guide",
  },
  {
    id: "merchant",
    workbenchHref: MERCHANT_WORKSPACE_HREF,
    applyHref: "/provider/register",
    settingsHref: "/me/identities/merchant/settings",
    publicSurfaceHref: MERCHANT_PUBLIC_HREF,
    roleOrSlot: "provider",
  },
  {
    id: "region_steward",
    workbenchHref: STEWARD_WORKSPACE_HREF,
    applyHref: "/steward/register",
    settingsHref: "/me/identities/region-steward/settings",
    publicSurfaceHref: STEWARD_GOVERNANCE_HREF,
    roleOrSlot: "region_steward",
  },
  {
    id: "acquisition",
    workbenchHref: ACQUISITION_WORKSPACE_HREF,
    applyHref: "/market/acquisition",
    settingsHref: "/me/identities/acquisition/settings",
    publicSurfaceHref: ACQUISITION_PUBLIC_HREF,
    roleOrSlot: "acquisition",
  },
] as const;

export function workspaceSurfaceById(id: WorkspaceIdentityId): WorkspaceSurface {
  const row = WORKSPACE_SURFACES.find((s) => s.id === id);
  if (!row) throw new Error(`unknown workspace identity: ${id}`);
  return row;
}

/** Hub / settings 已开通槽：优先工作台，settings 由工作台内链 */
export function workspaceActiveHref(id: WorkspaceIdentityId): string {
  const s = workspaceSurfaceById(id);
  return s.workbenchHref ?? s.settingsHref;
}

export function workspaceForUserRole(role: string | null | undefined): WorkspaceSurface | null {
  const r = role?.trim().toLowerCase() ?? "";
  if (!r) return null;
  if (r === "provider") return workspaceSurfaceById("merchant");
  if (r === "tourist") return workspaceSurfaceById("traveler");
  return WORKSPACE_SURFACES.find((s) => s.roleOrSlot === r) ?? null;
}
