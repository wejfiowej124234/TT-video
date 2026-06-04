import {
  ADMIN_DEPLOY_ENV_LOCAL_BADGE_CLASS,
  ADMIN_DEPLOY_ENV_PRODUCTION_BADGE_CLASS,
  ADMIN_DEPLOY_ENV_STAGING_BADGE_CLASS,
} from "@/lib/adminUi";

/** ① 部署环境徽章（U11 子集 · 由 NEXT_PUBLIC 注入，非伪造 GO）。 */
export type AdminDeployEnv = "local" | "staging" | "production";
export function resolveAdminDeployEnv(): AdminDeployEnv | null {
  const raw = (process.env.NEXT_PUBLIC_ADMIN_DEPLOY_ENV ?? "").trim().toLowerCase();
  if (raw === "staging" || raw === "stg") return "staging";
  if (raw === "production" || raw === "prod") return "production";
  if (process.env.NEXT_PUBLIC_ADMIN_SHOW_ENV_BADGE === "1") return "local";
  return null;
}

export function adminDeployEnvLabelKey(env: AdminDeployEnv): string {
  if (env === "staging") return "admin_shell_env_staging_badge";
  if (env === "production") return "admin_shell_env_production_badge";
  return "admin_shell_phase_local_badge";
}

export function adminDeployEnvBadgeClass(env: AdminDeployEnv): string {
  if (env === "staging") return ADMIN_DEPLOY_ENV_STAGING_BADGE_CLASS;
  if (env === "production") return ADMIN_DEPLOY_ENV_PRODUCTION_BADGE_CLASS;
  return ADMIN_DEPLOY_ENV_LOCAL_BADGE_CLASS;
}
