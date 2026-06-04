"use client";

import { useMemo } from "react";

import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminShellPreviewRole } from "@/lib/admin/useAdminShellPreviewRole";

export type AdminShellRoleMode = "preview" | "db" | "env_override" | "mapped" | "unknown";

function parseConsoleRole70(raw: string | null | undefined): ConsoleRole70 | null {
  if (!raw?.trim()) return null;
  const r = raw.trim() as ConsoleRole70;
  return r === "SuperAdmin" ||
    r === "Ops" ||
    r === "CS" ||
    r === "Risk" ||
    r === "Finance" ||
    r === "Auditor"
    ? r
    : null;
}

function shellModeFromSource(source: string | null): AdminShellRoleMode {
  if (!source) return "unknown";
  if (source.startsWith("env:")) return "env_override";
  if (source.startsWith("db:")) return "db";
  return "mapped";
}

/** IA-06 · Shell 分组过滤真值：session 预览优先，否则 API `console_role_70`（DB/映射）。 */
export function useAdminEffectiveShellRole() {
  const caps = useAdminCapabilities();
  const previewRole = useAdminShellPreviewRole();
  const dbRole = parseConsoleRole70(caps.consoleRole70);
  const source = caps.consoleRoleSource;
  const mode = previewRole ? "preview" : shellModeFromSource(source);

  const shellFilterRole = useMemo(
    () => previewRole ?? dbRole,
    [previewRole, dbRole],
  );

  return {
    previewRole,
    dbRole,
    shellFilterRole,
    consoleRoleSource: source,
    mode,
    capsLoading: caps.loading,
    permissionsLoaded: caps.permissionsLoaded,
  };
}
