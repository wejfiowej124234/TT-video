import type { UserShape } from "@/components/me/constants";

export function meSettingsUserId(user: UserShape | null | undefined): string | null {
  if (!user) return null;
  const top = user.id;
  if (typeof top === "string" && top.trim()) return top.trim();
  const nested = (user as { user?: { id?: string | null } }).user?.id;
  if (typeof nested === "string" && nested.trim()) return nested.trim();
  return null;
}
