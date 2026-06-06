"use client";

import { createContext, useContext, type ReactNode } from "react";

import { AdminL5ConfirmDialog } from "@/components/admin/AdminL5ConfirmDialog";
import type { AdminL5ConfirmRequest } from "@/lib/admin/adminL5ConfirmTypes";
import { useAdminL5ConfirmState } from "@/lib/admin/useAdminL5ConfirmState";

const AdminL5ConfirmContext = createContext<((req: AdminL5ConfirmRequest) => void) | null>(null);

export function AdminL5ConfirmProvider({ children }: { children: ReactNode }) {
  const state = useAdminL5ConfirmState();

  return (
    <AdminL5ConfirmContext.Provider value={state.request}>
      {children}
      <AdminL5ConfirmDialog
        open={state.open}
        busy={state.busy}
        pending={state.pending}
        onCancel={state.cancel}
        onConfirm={state.confirm}
      />
    </AdminL5ConfirmContext.Provider>
  );
}

/** Admin 子树内请求 L5 危险操作确认（须包在 AdminL5ConfirmProvider 内）。 */
export function useAdminL5ConfirmRequest(): (req: AdminL5ConfirmRequest) => void {
  const ctx = useContext(AdminL5ConfirmContext);
  if (!ctx) {
    throw new Error("useAdminL5ConfirmRequest must be used within AdminL5ConfirmProvider");
  }
  return ctx;
}
