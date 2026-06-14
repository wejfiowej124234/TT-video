import {
  type ActiveWorkspaceContextId,
  listSelectableWorkspaceContexts,
  shouldShowHeaderWorkspaceContextSwitcher,
  workspaceContextLabelKey,
} from "@/lib/header/activeWorkspaceContext";
import type { MeIdentitySlot } from "@/lib/meIdentitySlots";

export type HeaderWorkspaceContextNavOption = {
  id: ActiveWorkspaceContextId;
  labelKey: string;
};

export function headerWorkspaceContextNavOptions(
  slots: MeIdentitySlot[] | null | undefined,
): HeaderWorkspaceContextNavOption[] {
  return listSelectableWorkspaceContexts(slots).map((id) => ({
    id,
    labelKey: workspaceContextLabelKey(id),
  }));
}

export function headerWorkspaceContextSwitcherVisible(
  slots: MeIdentitySlot[] | null | undefined,
): boolean {
  return shouldShowHeaderWorkspaceContextSwitcher(listSelectableWorkspaceContexts(slots));
}
