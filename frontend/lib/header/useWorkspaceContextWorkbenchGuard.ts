"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  listSelectableWorkspaceContexts,
  readActiveWorkspaceContext,
  resolveActiveWorkspaceContext,
} from "@/lib/header/activeWorkspaceContext";
import { resolveOperatorWorkbenchRedirect } from "@/lib/header/workspaceContextWorkbenchNav";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";

/** W1-B3 · 工作台页：context 与路径不一致时 redirect 到当前 operator 工作台 */
export function useWorkspaceContextWorkbenchGuard(): void {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slots, ready } = useMeIdentitySlots();

  useEffect(() => {
    if (!ready) return;
    const selectable = listSelectableWorkspaceContexts(slots);
    const stored = readActiveWorkspaceContext();
    const urlIdentity = searchParams?.get("identity") ?? null;
    const context = resolveActiveWorkspaceContext({
      stored,
      urlIdentity,
      selectableIds: selectable,
    });
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const redirect = resolveOperatorWorkbenchRedirect(pathname, search, context);
    if (redirect) router.replace(redirect);
  }, [ready, slots, pathname, searchParams, router]);
}
