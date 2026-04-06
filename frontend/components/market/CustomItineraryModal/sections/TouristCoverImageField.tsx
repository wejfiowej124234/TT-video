"use client";

import Image from "next/image";
import { useId } from "react";
import type { CustomItineraryForm } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { MAX_COVER_FILE_SIZE } from "../constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export interface TouristCoverImageFieldProps {
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  coverFileTooBig: boolean;
  setCoverFileTooBig: (v: boolean) => void;
  inputClass: string;
  labelClass: string;
  t: (key: string) => string;
}

export default function TouristCoverImageField({
  form,
  setForm,
  coverFileTooBig,
  setCoverFileTooBig,
  inputClass,
  labelClass,
  t,
}: TouristCoverImageFieldProps) {
  const coverImageUrlId = useId();
  return (
    <div>
      <label htmlFor={coverImageUrlId} className={labelClass}>
        {t("market_coverImage")}
      </label>
      <p className="text-meta text-white/70 mb-1">{t("market_coverUploadHint")}</p>
      {coverFileTooBig && (
        <p className="text-meta text-warning/90 mb-1" role="status">
          {t("market_coverFileTooBig")}
        </p>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-start rounded-[var(--radius-sm)] border border-white/25 bg-white/5 px-3 py-2 text-small text-white hover:bg-white/10 focus-within:ring-1 focus-within:ring-travel-400">
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
              reader.onload = () => {
                const dataUrl = reader.result as string;
                setForm((f) => ({ ...f, image: dataUrl }));
              };
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
          <div className="relative w-20 h-20 rounded-[var(--radius-sm)] overflow-hidden border border-white/20 bg-slate-800 shrink-0">
            <Image
              src={form.image}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
              onError={() => setForm((f) => ({ ...f, image: "" }))}
            />
          </div>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              setForm((f) => ({ ...f, image: "" }));
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} text-meta text-white/80 hover:text-white border border-white/30 rounded-[var(--radius-sm)] px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-400`}
            >
              {t("market_coverClear")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
