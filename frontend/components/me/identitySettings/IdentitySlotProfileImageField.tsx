"use client";

import { useCallback, useState } from "react";
import GuideRegisterFileField from "@/app/guide/register/GuideRegisterFileField";
import { guideRegFileMeta, guideRegLabel } from "@/app/guide/register/guideRegisterUiClasses";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { resolveApiUploadUrl } from "@/lib/me/resolveApiUploadUrl";
import { uploadIdentityProfileImage } from "@/lib/me/uploadIdentityProfileImage";

export function IdentitySlotProfileImageField({
  id,
  labelKey,
  hintKey = "identity_profile_image_hint",
  uploadCtaKey = "identity_profile_image_upload_cta",
  imageUrl,
  onImageUrlChange,
  t,
  readOnly = false,
}: {
  id: string;
  labelKey: string;
  hintKey?: string;
  uploadCtaKey?: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  t: (key: string) => string;
  readOnly?: boolean;
}) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onPick = useCallback(
    async (file: File | null) => {
      setUploadError(null);
      if (!file) {
        setPendingFile(null);
        onImageUrlChange("");
        return;
      }
      setPendingFile(file);
      setUploading(true);
      try {
        const url = await uploadIdentityProfileImage(file);
        onImageUrlChange(url);
        setPendingFile(null);
      } catch (e) {
        const msg =
          e instanceof Error && e.message === "identity_profile_image_bad_type"
            ? t("identity_profile_image_bad_type")
            : mapApiReadError(e, t, "identity_profile_image_upload_failed");
        setUploadError(msg);
        setPendingFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onImageUrlChange, t],
  );

  const previewSrc = pendingFile ? null : resolveApiUploadUrl(imageUrl);

  if (readOnly) {
    return (
      <div className="flex flex-col gap-2 pb-2" data-tt-identity-profile-image-field={id}>
        <p className={guideRegLabel}>{t(labelKey)}</p>
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- API upload preview
          <img
            src={previewSrc}
            alt=""
            className="max-h-36 w-full max-w-xs rounded-xl border border-ref-sun/25 object-cover"
          />
        ) : (
          <p className={guideRegFileMeta}>{t("me_guide_profile_avatar_empty")}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 pb-2"
      data-tt-identity-profile-image-field={id}
      data-tt-me-guide-profile-avatar-upload="1"
    >
      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- API upload preview
        <img
          src={previewSrc}
          alt=""
          className="max-h-36 w-full max-w-xs rounded-xl border border-ref-sun/25 object-cover"
        />
      ) : null}
      <GuideRegisterFileField
        id={id}
        label={t(labelKey)}
        hint={t(uploadCtaKey)}
        dropHintKey="identity_profile_image_drop_hint"
        accept="image/jpeg,image/png,image/webp"
        file={pendingFile}
        pendingName={uploading ? t("identity_profile_image_uploading") : null}
        onPick={(f) => void onPick(f)}
        onClear={() => void onPick(null)}
        invalid={Boolean(uploadError)}
        inlineError={uploadError}
        t={t}
      />
      <p className={guideRegFileMeta}>{t(hintKey)}</p>
    </div>
  );
}
