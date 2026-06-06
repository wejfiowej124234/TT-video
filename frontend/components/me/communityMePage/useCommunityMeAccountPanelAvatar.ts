import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { clearGetMeCache, postMeProfileAvatar } from "@/lib/apiClient";
import { mapProfileAvatarUploadError } from "@/lib/me/mapProfileAvatarUploadError";
import { isCommunityMeAvatarUploadEnabled } from "@/lib/communityMeFeatureFlags";
import {
  COMMUNITY_ME_PROFILE_AVATAR_MAX_BYTES,
  type CommunityMeAccountPanelTFunc,
} from "./communityMeAccountPanelUtils";

export function useCommunityMeAccountPanelAvatar({
  t,
  compactVertical,
  profileReady,
  loadMe,
}: {
  t: CommunityMeAccountPanelTFunc;
  compactVertical: boolean;
  profileReady: boolean;
  loadMe: (opts?: { silent?: boolean }) => void;
}) {
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const profileDetailsRef = useRef<HTMLDetailsElement>(null);
  const [avatarUploadBusy, setAvatarUploadBusy] = useState(false);
  const [avatarUploadErr, setAvatarUploadErr] = useState<string | null>(null);
  const avatarLocalUploadEnabled = isCommunityMeAvatarUploadEnabled();

  const onAvatarPickClick = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setAvatarUploadErr(null);
      if (avatarLocalUploadEnabled) {
        avatarFileRef.current?.click();
        return;
      }
      if (typeof window !== "undefined") {
        if (compactVertical && profileDetailsRef.current) profileDetailsRef.current.open = true;
        window.location.hash = "me-platform-profile";
      }
    },
    [avatarLocalUploadEnabled, compactVertical]
  );

  const onAvatarFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !avatarLocalUploadEnabled) return;
      if (f.type !== "image/jpeg" && f.type !== "image/png" && f.type !== "image/webp") {
        setAvatarUploadErr(t("community_me_avatar_upload_failed"));
        return;
      }
      if (f.size > COMMUNITY_ME_PROFILE_AVATAR_MAX_BYTES) {
        setAvatarUploadErr(t("community_me_avatar_upload_too_large"));
        return;
      }
      let dataUrl: string;
      try {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onloadend = () => {
            const s = fr.result;
            if (typeof s === "string") resolve(s);
            else reject(new Error("read_failed"));
          };
          fr.onerror = () => reject(new Error("read_failed"));
          fr.readAsDataURL(f);
        });
      } catch {
        setAvatarUploadErr(t("community_me_avatar_upload_failed"));
        return;
      }
      setAvatarUploadBusy(true);
      setAvatarUploadErr(null);
      try {
        await postMeProfileAvatar({ content_base64: dataUrl });
        clearGetMeCache();
        loadMe({ silent: true });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("traveltrust:profile-updated"));
        }
      } catch (err) {
        setAvatarUploadErr(mapProfileAvatarUploadError(err, t, "community_me_avatar_upload_failed"));
      } finally {
        setAvatarUploadBusy(false);
      }
    },
    [avatarLocalUploadEnabled, loadMe, t]
  );

  useEffect(() => {
    if (!compactVertical || !profileReady) return;
    const openIfHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#me-platform-profile" && profileDetailsRef.current) {
        profileDetailsRef.current.open = true;
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, [compactVertical, profileReady]);

  return {
    avatarFileRef,
    profileDetailsRef,
    avatarUploadBusy,
    avatarUploadErr,
    avatarLocalUploadEnabled,
    onAvatarPickClick,
    onAvatarFileChange,
  };
}
