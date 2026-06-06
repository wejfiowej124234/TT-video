"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { getIdempotencyKey, postOrderSetEscrowAddress } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  escrowExperienceInputClass,
  escrowExperiencePrimaryCtaClass,
  escrowExperienceSecondaryBtnClass,
} from "@/lib/escrowExperienceUi";
import {
  escrowProtocolCompactInputClass,
  escrowProtocolMetaClass,
  escrowProtocolPillFocusClass,
  escrowProtocolSecondaryBtnClass,
  escrowProtocolSubheadingClass,
  TT_ESCROW_PROTOCOL_SECTION,
} from "@/lib/escrowProtocolUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

export interface SetEscrowAddressBlockProps {
  orderId: string;
  onSuccess: () => void;
  variantDid?: boolean;
  /** Experience 草稿高级区：深色壳，避免 `bg-bg-soft` 浅底 + 浅字 */
  variantExperience?: boolean;
  /** B-067 */
  protocolPaused?: boolean;
}

/** P18 链下 mock：模拟写入托管地址，仅后端 chain_off 时生效 */
export default function SetEscrowAddressBlock({
  orderId,
  onSuccess,
  variantDid,
  variantExperience = false,
  protocolPaused = false,
}: SetEscrowAddressBlockProps) {
  const { t } = useTranslation();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionTitleId = useId();
  const sectionDescId = useId();
  const addressFieldId = useId();
  const addressHintId = useId();
  const trimmed = address.trim();
  const valid = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
  const showInvalid = trimmed.length > 0 && !valid;

  const submitEscrowAddress = useCallback(async () => {
    if (protocolPaused) return;
    const addr = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return;
    setLoading(true);
    setError(null);
    try {
      await postOrderSetEscrowAddress(orderId, addr, getIdempotencyKey());
      onSuccess();
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("SetEscrowAddressBlock fetch:", err);
      }
      setError(mapApiReadError(err, t, "escrow_writeFailed"));
    } finally {
      setLoading(false);
    }
  }, [address, orderId, onSuccess, protocolPaused, t]);
  const isExperience = !!variantExperience;
  const isDid = !!variantDid && !isExperience;
  const pillFocusClass = isDid
    ? escrowProtocolPillFocusClass
    : isExperience
      ? `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-ink-950`
      : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const sectionClass = isExperience
    ? "rounded-[var(--radius-md)] border border-white/12 bg-black/25 p-4 md:p-5 space-y-3"
    : isDid
      ? TT_ESCROW_PROTOCOL_SECTION
      : "rounded-[var(--radius-sm)] bg-bg-soft border border-ink-200 p-6 space-y-3";
  const titleClass = isExperience
    ? "text-body font-semibold text-ref-sun/95"
    : isDid
      ? escrowProtocolSubheadingClass
      : "text-body font-semibold text-ink-800";
  const descClass = isExperience
    ? "text-small text-slate-300 leading-relaxed"
    : isDid
      ? `text-small ${escrowProtocolMetaClass}`
      : "text-small text-ink-600";
  const labelClass = isExperience
    ? "text-meta font-medium text-slate-300"
    : isDid
      ? `text-meta font-medium ${escrowProtocolMetaClass}`
      : "text-meta font-medium text-ink-700";
  const inputClass = isExperience
    ? `${escrowExperienceInputClass} font-mono min-h-[44px] max-w-full`
    : isDid
      ? `${escrowProtocolCompactInputClass} min-h-[44px]`
      : "font-mono border border-ink-200 rounded-[var(--radius-sm)] px-3 py-2 text-small w-full max-w-full bg-bg-console";

  return (
    <section
      className={sectionClass}
      aria-labelledby={sectionTitleId}
      aria-describedby={sectionDescId}
    >
      <h3 id={sectionTitleId} className={titleClass}>
        {t("escrow_mockSetEscrowTitle")}
      </h3>
      <p id={sectionDescId} className={descClass}>
        {t("escrow_mockSetEscrowDesc")}
      </p>
      {protocolPaused ? (
        <p className={isDid ? "text-small text-amber-200/95" : "text-small text-warning"} role="status">
          {t("escrow_protocolPause_body")}
        </p>
      ) : null}
      {showInvalid ? (
        <p id={addressHintId} className="sr-only">
          {t("escrow_invalidEvmAddressHint")}
        </p>
      ) : null}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void submitEscrowAddress();
        }}
      >
        <div className="flex flex-col gap-1 w-full max-w-md">
          <label htmlFor={addressFieldId} className={labelClass}>
            {t("escrow_intentFactContract")}
          </label>
          <input
            id={addressFieldId}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("auth_register_placeholder_wallet")}
            className={inputClass}
            aria-invalid={showInvalid}
            aria-describedby={showInvalid ? addressHintId : undefined}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={protocolPaused || loading || !valid}
          title={protocolPaused ? t("escrow_protocolPause_title") : undefined}
          aria-busy={loading ? true : undefined}
          className={`${
            isExperience
              ? `${escrowExperiencePrimaryCtaClass} w-auto self-end`
              : `btn-console rounded-[var(--radius-sm)] bg-trust-600 px-4 py-2 text-white text-small disabled:opacity-50 self-end`
          } ${pillFocusClass}`}
        >
          {loading ? t("escrow_writing") : t("escrow_writeEscrowAddress")}
        </button>
      </form>
      {error ? (
        <div className="space-y-2">
          <ApiErrorAlert message={error} tone={isDid ? "dark" : "default"} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void submitEscrowAddress();
            }}
          >
            <button
              type="submit"
              disabled={protocolPaused || loading || !valid}
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border px-3 py-2 text-small font-medium disabled:opacity-50 ${pillFocusClass} ${
                isExperience
                  ? escrowExperienceSecondaryBtnClass
                  : isDid
                    ? escrowProtocolSecondaryBtnClass
                    : "border-ink-300 bg-white text-ink-800 hover:bg-ink-50"
              }`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
