"use client";



import { useEffect, useId, useRef, useState, type DragEvent } from "react";

import GuideRegisterInlineFieldError from "./GuideRegisterInlineFieldError";
import { compressGuideRegisterImageFile } from "@/lib/guide/compressGuideRegisterImage";
import { MAX_FILE_SIZE } from "./constants";
import {

  guideRegFileMeta,

  guideRegFileSelected,

  guideRegFocusRing,

  guideRegLabel,

  guideRegSecondaryBtn,

} from "./guideRegisterUiClasses";



export default function GuideRegisterFileField({

  id,

  label,

  hint,

  accept,

  required,

  file,

  pendingName,

  onPick,

  onClear,

  invalid,

  inlineError,

  t,

}: {

  id: string;

  label: string;

  hint?: string;

  accept: string;

  required?: boolean;

  file: File | null;

  pendingName?: string | null;

  onPick: (f: File | null) => void;

  onClear: () => void;

  invalid?: boolean;

  inlineError?: string | null;

  t: (key: string) => string;

}) {

  const inputId = id;

  const dropHintId = useId();

  const inputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const display = file?.name ?? pendingName ?? null;



  useEffect(() => {

    if (!file || !file.type.startsWith("image/")) {

      setPreviewUrl(null);

      return;

    }

    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);

  }, [file]);



  const pickFromList = (files: FileList | null) => {
    const raw = files?.[0] ?? null;
    if (!raw) {
      onPick(null);
      return;
    }
    void (async () => {
      try {
        const compressed = await compressGuideRegisterImageFile(raw, MAX_FILE_SIZE);
        onPick(compressed);
      } catch {
        onPick(raw);
      }
    })();
  };



  const onDrop = (e: DragEvent) => {

    e.preventDefault();

    setDragOver(false);

    pickFromList(e.dataTransfer.files);

  };



  return (

    <div className="flex flex-col gap-2">

      <label className={guideRegLabel} htmlFor={inputId}>

        {label}

        {required ? <span className="text-ref-coral"> *</span> : null}

      </label>

      <div

        role="button"

        tabIndex={0}

        aria-labelledby={inputId}

        aria-describedby={dropHintId}

        onKeyDown={(e) => {

          if (e.key === "Enter" || e.key === " ") {

            e.preventDefault();

            inputRef.current?.click();

          }

        }}

        onClick={() => inputRef.current?.click()}

        onDragOver={(e) => {

          e.preventDefault();

          setDragOver(true);

        }}

        onDragLeave={() => setDragOver(false)}

        onDrop={onDrop}

        className={`cursor-pointer rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${

          invalid

            ? "border-ref-coral/50 bg-ref-coral/5"

            : dragOver

              ? "border-ref-sun/55 bg-ref-sun/10"

              : "border-ref-sun/22 bg-ref-sun/[0.03] hover:border-ref-sun/35"

        } ${guideRegFocusRing}`}

        aria-invalid={invalid || undefined}

      >

        <p id={dropHintId} className="text-meta text-slate-300/95">

          {t("guideRegister_fileDropHint")}

        </p>

        <input

          ref={inputRef}

          id={inputId}

          type="file"

          accept={accept}

          required={required && !display}

          className="sr-only"

          aria-required={required || undefined}

          onChange={(e) => pickFromList(e.target.files)}

        />

      </div>

      {previewUrl ? (

        // eslint-disable-next-line @next/next/no-img-element -- blob preview

        <img src={previewUrl} alt="" className="max-h-32 rounded-lg border border-ref-sun/20 object-contain" />

      ) : null}

      {display ? (

        <div className="flex flex-wrap items-center gap-2">

          <p className={guideRegFileSelected}>

            {t("guideRegister_selected")}

            {display}

          </p>

          <button

            type="button"

            onClick={(e) => {

              e.stopPropagation();

              onClear();

              if (inputRef.current) inputRef.current.value = "";

            }}

            className={`${guideRegSecondaryBtn} text-meta px-3 py-1.5 ${guideRegFocusRing}`}

          >

            {t("guideRegister_fileClear")}

          </button>

        </div>

      ) : null}

      <GuideRegisterInlineFieldError message={inlineError} />

      {hint ? <p className={guideRegFileMeta}>{hint}</p> : null}

    </div>

  );

}


