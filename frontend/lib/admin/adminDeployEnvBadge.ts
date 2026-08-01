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

/**
 * Staging / production：全体 Admin 可见。
 * Local：仅 maintainer UI（避免普通 Admin 误读本地徽章）。
 */
export function adminDeployEnvBadgeVisible(
  env: AdminDeployEnv | null | undefined,
  maintainerUi: boolean,
): boolean {
  if (!env) return false;
  if (env === "local") return maintainerUi;
  return true;
}

/** i18n 徽章文案；Staging + Sepolia（chain 11155111）追加链名。 */
export function adminDeployEnvDisplayLabel(
  env: AdminDeployEnv,
  t: (key: string) => string,
): string {
  const base = t(adminDeployEnvLabelKey(env));
  if (env === "staging" && process.env.NEXT_PUBLIC_CHAIN_ID === "11155111") {
    return `${base} · ${t("admin_shell_env_staging_chain_sepolia")}`;
  }
  return base;
}
