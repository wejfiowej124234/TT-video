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

function useAdminCapabilitiesInternal(options?: { fetchEnabled?: boolean }): AdminCapabilitiesValue {
  const fetchEnabled = options?.fetchEnabled ?? true;
  const [role, setRole] = useState<string | null>(null);
  const [consoleRole70, setConsoleRole70] = useState<ConsoleRole70 | null>(null);
  const [consoleRoleSource, setConsoleRoleSource] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [matrixVersion, setMatrixVersion] = useState<string | null>(null);
  const [roleMatrixPreview, setRoleMatrixPreview] = useState<Record<string, string[]> | null>(
    null,
  );
  const [phase2Prep, setPhase2Prep] = useState<AdminPhase2PrepFlags | null>(null);
  const [loading, setLoading] = useState(fetchEnabled);
  const [error, setError] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    setErrorCode(null);
    let headers: Record<string, string> = { "x-request-id": `admin-cap-${Date.now()}` };
    try {
      headers = { ...headers, ...getAuthHeaders() };
    } catch {
      setRole(null);
      setPermissions(new Set());
      setLoading(false);
      setError(true);
      setErrorCode("login_required");
      return;
    }

    void adminFetchJson<AdminCapabilitiesPayload & { code?: string }>(
      "AdminCapabilities",
      apiUrl(routes.admin.capabilities),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          setError(true);
          setErrorCode(typeof body.code === "string" ? body.code : `http_${res.status}`);
          setRole(null);
          setPermissions(new Set());
          return;
        }
        const perms = Array.isArray(body.permissions) ? body.permissions : [];
        setRole(typeof body.role === "string" ? body.role : null);
        const cr = typeof body.console_role_70 === "string" ? body.console_role_70 : null;
        setConsoleRole70(
          cr === "SuperAdmin" ||
            cr === "Ops" ||
            cr === "CS" ||
            cr === "Risk" ||
            cr === "Finance" ||
            cr === "Auditor"
            ? cr
            : null,
        );
        setConsoleRoleSource(
          typeof body.console_role_source === "string" ? body.console_role_source : null,
        );
        setMatrixVersion(typeof body.matrix_version === "string" ? body.matrix_version : null);
        setPermissions(new Set(perms.filter((p) => typeof p === "string")));
        setRoleMatrixPreview(
          body.role_matrix_preview && typeof body.role_matrix_preview === "object"
            ? (body.role_matrix_preview as Record<string, string[]>)
            : null,
        );
        setPhase2Prep(
          body.phase2_prep && typeof body.phase2_prep === "object"
            ? (body.phase2_prep as AdminPhase2PrepFlags)
            : null,
        );
      })
      .catch((e) => {
        logAdminFetch("AdminCapabilities", e);
        setError(true);
      })
      .finally(() => setLoading(false));
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
