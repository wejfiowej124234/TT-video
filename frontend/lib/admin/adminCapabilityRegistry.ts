import { isSuperAdminActorRole } from "./adminActorFromMe";

/** 70 目标域 · ① 映射到 `admin` | `super_admin` 二元门禁（② 六角色扩展）。 */
export type AdminCapabilityDomainId =
  | "P0_inbox"
  | "P1_onboarding"
  | "P2_users"
  | "P3_orders_disputes"
  | "P4_finance"
  | "P5_community"
  | "P6_trust_ops"
  | "P7_platform"
  | "P8_audit"
  | "P9_acquisition";

export type AdminCapabilityLevel = "none" | "read" | "write" | "approve";

export function adminCapabilityLevelForRole(
  role: string | null,
  needsSuper: boolean,
): AdminCapabilityLevel {
  if (!role) return "none";
  const r = role.trim().toLowerCase();
  if (r !== "admin" && r !== "super_admin") return "none";
  if (needsSuper && !isSuperAdminActorRole(role)) return "read";
  if (isSuperAdminActorRole(role)) return "approve";
  return "write";
}

/** i18n keys for layout capability strip (① honesty). */
export function adminCapabilityStripKeys(role: string | null): {
  rbacPhaseKey: "admin_capability_strip_phase_01";
  actorKey: "admin_capability_strip_actor_admin" | "admin_capability_strip_actor_super" | "admin_capability_strip_actor_unknown";
  approvalKey:
    | "admin_capability_strip_can_approve"
    | "admin_capability_strip_cannot_approve";
} {
  if (isSuperAdminActorRole(role)) {
    return {
      rbacPhaseKey: "admin_capability_strip_phase_01",
      actorKey: "admin_capability_strip_actor_super",
      approvalKey: "admin_capability_strip_can_approve",
    };
  }
  if ((role ?? "").trim().toLowerCase() === "admin") {
    return {
      rbacPhaseKey: "admin_capability_strip_phase_01",
      actorKey: "admin_capability_strip_actor_admin",
      approvalKey: "admin_capability_strip_cannot_approve",
    };
  }
  return {
    rbacPhaseKey: "admin_capability_strip_phase_01",
    actorKey: "admin_capability_strip_actor_unknown",
    approvalKey: "admin_capability_strip_cannot_approve",
  };
}
