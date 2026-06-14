"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import {
  type ActiveWorkspaceContextId,
  getServerActiveWorkspaceContext,
  listSelectableWorkspaceContexts,
  readActiveWorkspaceContext,
  resolveActiveWorkspaceContext,
  subscribeActiveWorkspaceContext,
  workspaceContextFromPublishHubIdentityParam,
  writeActiveWorkspaceContext,
} from "@/lib/header/activeWorkspaceContext";
import type { MeIdentitySlot } from "@/lib/meIdentitySlots";

export function useActiveWorkspaceContext(slots: MeIdentitySlot[] | null | undefined) {
  const searchParams = useSearchParams();
  const urlIdentity = searchParams?.get("identity") ?? null;
  const selectable = useMemo(() => listSelectableWorkspaceContexts(slots), [slots]);

  const stored = useSyncExternalStore(
    subscribeActiveWorkspaceContext,
    readActiveWorkspaceContext,
    getServerActiveWorkspaceContext,
  );

  const context = useMemo(
    () =>
      resolveActiveWorkspaceContext({
        stored,
        urlIdentity,
        selectableIds: selectable,
      }),
    [stored, urlIdentity, selectable],
  );

  const urlOverridesContext = useMemo(() => {
    const fromUrl = workspaceContextFromPublishHubIdentityParam(urlIdentity);
    return fromUrl != null && fromUrl !== stored;
  }, [urlIdentity, stored]);

  const setContext = useCallback(
    (next: ActiveWorkspaceContextId) => {
      writeActiveWorkspaceContext(next);
    },
    [],
  );

  return {
    context,
    setContext,
    stored,
    selectable,
    urlOverridesContext,
  };
}
