/**
 * Batch-11 W12 · guides triangle IA · HU-367 / HU-416 / HU-417
 * Directory ≠ applications queue ≠ official guides CMS
 * ≠ fund write · ≠ Escrow state-machine · ≠ Production GO
 */

export const GUIDES_TRIANGLE_L5_W12_PROBE = "guides-triangle-l5-batch11-w12-v1" as const;

export type GuidesTriangleVertexId = "directory" | "applications" | "official";

export type GuidesTriangleVertex = {
  id: GuidesTriangleVertexId;
  href: string;
  titleKey: string;
  roleKey: string;
  notKey: string;
};

/** HU-367 / HU-416 · three surfaces · exclusive roles */
export const GUIDES_TRIANGLE_VERTICES: GuidesTriangleVertex[] = [
  {
    id: "directory",
    href: "/admin/guides",
    titleKey: "admin_guides_triangle_directory_title",
    roleKey: "admin_guides_triangle_directory_role",
    notKey: "admin_guides_triangle_directory_not",
  },
  {
    id: "applications",
    href: "/admin/guide-applications",
    titleKey: "admin_guides_triangle_applications_title",
    roleKey: "admin_guides_triangle_applications_role",
    notKey: "admin_guides_triangle_applications_not",
  },
  {
    id: "official",
    href: "/admin/official/guides",
    titleKey: "admin_guides_triangle_official_title",
    roleKey: "admin_guides_triangle_official_role",
    notKey: "admin_guides_triangle_official_not",
  },
];

export function resolveGuidesTriangle(current: GuidesTriangleVertexId): {
  vertices: GuidesTriangleVertex[];
  current: GuidesTriangleVertexId;
  policy: "exclusive_surfaces";
} {
  return {
    vertices: GUIDES_TRIANGLE_VERTICES,
    current,
    policy: "exclusive_surfaces",
  };
}

/** HU-417 · list inventory display (prefer API total; else loaded snapshot) */
export type GuidesInventorySnapshot = {
  total: number | null;
  loaded: number;
  kind: "api_total" | "list_snapshot";
  honestyKey: string;
};

export function resolveGuidesInventorySnapshot(input: {
  apiTotal?: number | null;
  loadedCount: number;
}): GuidesInventorySnapshot {
  const loaded = Number.isFinite(input.loadedCount) ? Math.max(0, Math.floor(input.loadedCount)) : 0;
  if (typeof input.apiTotal === "number" && Number.isFinite(input.apiTotal)) {
    return {
      total: Math.max(0, Math.floor(input.apiTotal)),
      loaded,
      kind: "api_total",
      honestyKey: "admin_guides_inventory_api_total_note",
    };
  }
  return {
    total: null,
    loaded,
    kind: "list_snapshot",
    honestyKey: "admin_guides_inventory_snapshot_note",
  };
}

export function parseGuidesListApiTotal(body: {
  total?: unknown;
  applied_filters?: Record<string, unknown> | null;
}): number | null {
  if (typeof body.total === "number" && Number.isFinite(body.total)) {
    return Math.max(0, Math.floor(body.total));
  }
  const af = body.applied_filters;
  if (af && typeof af.matched_before_limit === "number" && Number.isFinite(af.matched_before_limit)) {
    return Math.max(0, Math.floor(af.matched_before_limit));
  }
  return null;
}
