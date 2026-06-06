import {
  communityMediaAbsoluteUrlForRender,
} from "@/lib/communityMediaClientUrl";
import { isCommunityMeBioEnabled } from "@/lib/communityMeFeatureFlags";
import { meProtocolRoleForDisplay, meRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import type { UserShape } from "./constants";

export type MeProfileReadModel = {
  avatarSrcResolved: string;
  showAvatar: boolean;
  initial: string;
  roleLabel: string;
  kycRaw: string;
  bioFeatureOn: boolean;
  bioRead: string;
};

export function resolveMeProfileReadModel(
  user: UserShape,
  avatarError: boolean,
  t: (k: string) => string
): MeProfileReadModel {
  const avatarSrcResolved = user?.avatar_url?.trim()
    ? communityMediaAbsoluteUrlForRender(user.avatar_url.trim())
    : "";
  const showAvatar = Boolean(avatarSrcResolved) && !avatarError;
  const initial = (user?.nickname?.trim() && user.nickname.charAt(0)) || "?";
  const roleLabel = t(meRoleLabelI18nKey(meProtocolRoleForDisplay(user)));
  const kycRaw =
    typeof user?.kyc_status === "string" && user.kyc_status.trim() !== ""
      ? user.kyc_status.trim()
      : "none";
  const bioFeatureOn = isCommunityMeBioEnabled();
  const bioRead = bioFeatureOn && typeof user.bio === "string" ? user.bio.trim() : "";
  return { avatarSrcResolved, showAvatar, initial, roleLabel, kycRaw, bioFeatureOn, bioRead };
}
