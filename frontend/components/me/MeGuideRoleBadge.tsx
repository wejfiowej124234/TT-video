"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { UserShape } from "@/components/me/constants";
import { meRoleLabelI18nKey, userIsGuide } from "@/lib/meRoleDisplay";
import { TT_ME_GUIDE_ROLE_BADGE } from "@/lib/me/meGuideRoleBadgeL5";

/** RP-003 · Guide role badge (display-only · `/me` + `/guide`). */
export function MeGuideRoleBadge({
  user,
  className = "",
}: {
  user: Pick<UserShape, "role" | "role_traveltrust"> | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!userIsGuide(user)) return null;

  return (
    <span
      className={`${TT_ME_GUIDE_ROLE_BADGE.pill} ${className}`.trim()}
      data-tt-me-guide-role-badge="1"
      title={t("me_role_guide_badge_hint")}
    >
      {t(meRoleLabelI18nKey("guide"))}
    </span>
  );
}
