"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { useId, type Dispatch, type SetStateAction } from "react";
import type { CustomItineraryForm } from "../types";
import { MAX_COVER_FILE_SIZE } from "../constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { marketStudioModalGlassFileTriggerLabelInline } from "../../marketStudioModalLayout";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export function GuideFormCoverImageFieldBlock({
  form,
  setForm,
  labelClass,
  inputClass,
  setViewingGuideImage,
  setCoverFileTooBig,
  t,
}: {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  labelClass: string;
  inputClass: string;
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  setCoverFileTooBig: (v: boolean) => void;
  t: (key: string) => string;
}) {
  const coverImageUrlId = useId();
  return (
    <div>
      <label htmlFor={coverImageUrlId} className={labelClass}>
        {t("market_coverImage")}
      </label>
      <p className="text-meta text-white/70 mb-1">{t("market_guideCoverHint")}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <label className={marketStudioModalGlassFileTriggerLabelInline}>
          <span className="sr-only">{t("market_coverImage")}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setCoverFileTooBig(false);
              if (file.size > MAX_COVER_FILE_SIZE) {
                setCoverFileTooBig(true);
                setForm((f) => ({ ...f, image: "" }));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setForm((f) => ({ ...f, image: reader.result as string }));
              reader.readAsDataURL(file);
            }}
          />
          {t("market_coverUpload")}
        </label>
        <input
          id={coverImageUrlId}
          type="url"
          maxLength={4096}
          value={typeof form.image === "string" && !form.image.startsWith("data:") ? form.image : ""}
          onChange={(e) => setForm((f) => ({ ...f, image: e.target.value.slice(0, 4096) }))}
          className={`${inputClass} flex-1 min-w-[180px]`}
          placeholder={t("market_coverImagePlaceholder")}
        />
      </div>
      {form.image && (
        <div className="mt-2 flex items-center gap-2">
          <form
            className="inline shrink-0"
            onSubmit={(e) => {
              e.preventDefault();
              setViewingGuideImage({ label: t("market_coverImage"), url: form.image });
            }}
          >
            <button
              type="submit"
              className="relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-ref-sun/16 bg-ink-950/60 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
            >
              <Image
                src={communityMediaAbsoluteUrlForRender(form.image)}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={communityMediaNextImageUnoptimized(communityMediaAbsoluteUrlForRender(form.image))}
                onError={() => setForm((f) => ({ ...f, image: "" }))}
              />
            </button>
          </form>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              setForm((f) => ({ ...f, image: "" }));
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} text-meta text-white/80 hover:text-white border border-ref-sun/24 rounded-[var(--radius-sm)] px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]`}
            >
              {t("market_coverClear")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
