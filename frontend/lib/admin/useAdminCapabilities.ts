"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { adminFetchJson, logAdminFetch } from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import {
  adminCapabilitiesPermissionsLoaded,
  adminCapabilitiesUnavailable,
} from "@/lib/admin/adminCapabilitiesState";
import { markAdminCapabilitiesBootReady } from "@/lib/admin/adminCapabilitiesBootState";
import {
  applyAdminSessionExpiredClientReset,
  adminApiEnvelopeCode,
  maybeApplyAdminSessionExpiredFromAdminFetch,
} from "@/lib/admin/adminSessionExpiredClient";
import {
  clearAdminConsoleAccessCookie,
  isAdminConsoleAccessDeniedErrorCode,
  writeAdminConsoleAccessCookie,
} from "@/lib/admin/adminConsoleAccessCookie";
import {
  dedupeAdminCapabilitiesFetch,
  readAdminCapabilitiesFetchCache,
  writeAdminCapabilitiesFetchCache,
  type AdminCapabilitiesCachePayload,
} from "@/lib/admin/adminCapabilitiesFetchCache";
import type { AdminPhase2PrepFlags, ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

export type AdminCapabilitiesPayload = {
  status?: string;
  role?: string;
  console_role_70?: string;
  console_role_source?: string;
  matrix_version?: string;
  permissions?: string[];
  role_matrix_preview?: Record<string, string[]>;
  phase2_prep?: AdminPhase2PrepFlags;
};

export type AdminCapabilitiesValue = {
  role: string | null;
  consoleRole70: ConsoleRole70 | null;
  consoleRoleSource: string | null;
  permissions: Set<string>;
  matrixVersion: string | null;
  roleMatrixPreview: Record<string, string[]> | null;
  phase2Prep: AdminPhase2PrepFlags | null;
  loading: boolean;
  error: boolean;
  errorCode: string | null;
  permissionsLoaded: boolean;
  capabilitiesUnavailable: boolean;
  hasPermission: (perm: string) => boolean;
  reload: () => void;
};

const AdminCapabilitiesContext = createContext<AdminCapabilitiesValue | null>(null);

function parseConsoleRole70(raw: string | null): ConsoleRole70 | null {
  return raw === "SuperAdmin" ||
    raw === "Ops" ||
    raw === "CS" ||
    raw === "Risk" ||
    raw === "Finance" ||
    raw === "Auditor"
    ? raw
    : null;
}

function applyCapabilitiesCacheToState(
  cached: AdminCapabilitiesCachePayload,
  setters: {
    setRole: (v: string | null) => void;
    setConsoleRole70: (v: ConsoleRole70 | null) => void;
    setConsoleRoleSource: (v: string | null) => void;
    setPermissions: (v: Set<string>) => void;
    setMatrixVersion: (v: string | null) => void;
    setRoleMatrixPreview: (v: Record<string, string[]> | null) => void;
    setPhase2Prep: (v: AdminPhase2PrepFlags | null) => void;
  },
): void {
  setters.setRole(cached.role);
  setters.setConsoleRole70(parseConsoleRole70(cached.consoleRole70));
  setters.setConsoleRoleSource(cached.consoleRoleSource);
  setters.setPermissions(new Set(cached.permissions));
  setters.setMatrixVersion(cached.matrixVersion);
  setters.setRoleMatrixPreview(cached.roleMatrixPreview);
  setters.setPhase2Prep(
    cached.phase2Prep && typeof cached.phase2Prep === "object"
      ? (cached.phase2Prep as AdminPhase2PrepFlags)
      : null,
  );
}

function useAdminCapabilitiesInternal(options?: { fetchEnabled?: boolean }): AdminCapabilitiesValue {
  const fetchEnabled = options?.fetchEnabled ?? true;
  const warm = fetchEnabled ? readAdminCapabilitiesFetchCache() : null;
  if (warm && fetchEnabled) {
    markAdminCapabilitiesBootReady(true);
  }
  const [role, setRole] = useState<string | null>(warm?.role ?? null);
  const [consoleRole70, setConsoleRole70] = useState<ConsoleRole70 | null>(
    parseConsoleRole70(warm?.consoleRole70 ?? null),
  );
  const [consoleRoleSource, setConsoleRoleSource] = useState<string | null>(
    warm?.consoleRoleSource ?? null,
  );
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(warm?.permissions ?? []),
  );
  const [matrixVersion, setMatrixVersion] = useState<string | null>(warm?.matrixVersion ?? null);
  const [roleMatrixPreview, setRoleMatrixPreview] = useState<Record<string, string[]> | null>(
    warm?.roleMatrixPreview ?? null,
  );
  const [phase2Prep, setPhase2Prep] = useState<AdminPhase2PrepFlags | null>(
    warm?.phase2Prep && typeof warm.phase2Prep === "object"
      ? (warm.phase2Prep as AdminPhase2PrepFlags)
      : null,
  );
  const [loading, setLoading] = useState(fetchEnabled);
  const [error, setError] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const load = useCallback(() => {
    const cached = readAdminCapabilitiesFetchCache();
    if (cached) {
      applyCapabilitiesCacheToState(cached, {
        setRole,
        setConsoleRole70,
        setConsoleRoleSource,
        setPermissions,
        setMatrixVersion,
        setRoleMatrixPreview,
        setPhase2Prep,
      });
    }
    setLoading(true);
    setError(false);
    setErrorCode(null);

    let headers: Record<string, string> = { "x-request-id": `admin-cap-${Date.now()}` };
    try {
      headers = { ...headers, ...getAuthHeaders() };
    } catch {
      applyAdminSessionExpiredClientReset();
      return;
    }

    void dedupeAdminCapabilitiesFetch(async () => {
      const { res, body } = await adminFetchJson<AdminCapabilitiesPayload & { code?: string; error?: string }>(
        "AdminCapabilities",
        apiUrl(routes.admin.capabilities),
        { headers },
      );
      if (!res.ok) {
        const code = adminApiEnvelopeCode(body);
        if (maybeApplyAdminSessionExpiredFromAdminFetch(res, body)) {
          return null;
        }
        setError(true);
        setErrorCode(code ?? `http_${res.status}`);
        setRole(null);
        setPermissions(new Set());
        if (isAdminConsoleAccessDeniedErrorCode(code)) {
          writeAdminConsoleAccessCookie("denied");
        } else {
          clearAdminConsoleAccessCookie();
        }
        return null;
      }
      const perms = Array.isArray(body.permissions) ? body.permissions : [];
      const cr = typeof body.console_role_70 === "string" ? body.console_role_70 : null;
      const snapshot: AdminCapabilitiesCachePayload = {
        role: typeof body.role === "string" ? body.role : null,
        consoleRole70: cr,
        consoleRoleSource:
          typeof body.console_role_source === "string" ? body.console_role_source : null,
        permissions: perms.filter((p) => typeof p === "string"),
        matrixVersion: typeof body.matrix_version === "string" ? body.matrix_version : null,
        roleMatrixPreview:
          body.role_matrix_preview && typeof body.role_matrix_preview === "object"
            ? (body.role_matrix_preview as Record<string, string[]>)
            : null,
        phase2Prep:
          body.phase2_prep && typeof body.phase2_prep === "object"
            ? (body.phase2_prep as Record<string, unknown>)
            : null,
      };
      writeAdminCapabilitiesFetchCache(snapshot);
      writeAdminConsoleAccessCookie("granted");
      applyCapabilitiesCacheToState(snapshot, {
        setRole,
        setConsoleRole70,
        setConsoleRoleSource,
        setPermissions,
        setMatrixVersion,
        setRoleMatrixPreview,
        setPhase2Prep,
      });
      setError(false);
      setErrorCode(null);
      return snapshot;
    }).catch((e) => {
      logAdminFetch("AdminCapabilities", e);
      setError(true);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!fetchEnabled) return;
    load();
  }, [load, fetchEnabled]);

  useEffect(() => {
    if (!fetchEnabled) return;
    const onAuth = () => load();
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, [load, fetchEnabled]);

  const hasPermission = useCallback(
    (perm: string) => permissions.has(perm),
    [permissions],
  );

  const permissionsLoaded = adminCapabilitiesPermissionsLoaded(loading, error);
  const capabilitiesUnavailable = adminCapabilitiesUnavailable(loading, error);

  useEffect(() => {
    markAdminCapabilitiesBootReady(permissionsLoaded);
  }, [permissionsLoaded]);

  return useMemo(
    () => ({
      role,
      consoleRole70,
      consoleRoleSource,
      permissions,
      matrixVersion,
      roleMatrixPreview,
      phase2Prep,
      loading,
      error,
      errorCode,
      permissionsLoaded,
      capabilitiesUnavailable,
      hasPermission,
      reload: load,
    }),
    [
      role,
      consoleRole70,
      consoleRoleSource,
      permissions,
      matrixVersion,
      roleMatrixPreview,
      phase2Prep,
      loading,
      error,
      errorCode,
      permissionsLoaded,
      capabilitiesUnavailable,
      hasPermission,
      load,
    ],
  );
}

export function AdminCapabilitiesProvider({ children }: { children: ReactNode }) {
  const value = useAdminCapabilitiesInternal();
  return createElement(AdminCapabilitiesContext.Provider, { value }, children);
}

export function useAdminCapabilities(): AdminCapabilitiesValue {
  const ctx = useContext(AdminCapabilitiesContext);
  const fallback = useAdminCapabilitiesInternal({ fetchEnabled: !ctx });
  return ctx ?? fallback;
}
