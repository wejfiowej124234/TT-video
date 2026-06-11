import { clearGetMeCache, postGuide, postGuideUploadDoc } from "@/lib/apiClient";
import { clearGuideRegisterDraft } from "@/lib/guide/guideRegisterDraft";
import {
  clearGuideRegisterLastSubmitError,
  writeGuideRegisterLastSubmitError,
} from "@/lib/constants/guideRegisterKeys";
import type { GuideRegisterUploadPhase } from "./useGuideRegisterPage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  guideLicenseUrlHasHttpScheme,
  GUIDE_LICENSE_URL_MAX_LEN,
} from "@/lib/guideLicenseUrlScheme";
import {
  normalizeGuideLanguagesForWrite,
  normalizeGuideServiceTypesForWrite,
} from "@/lib/marketGuideFilterQuery";
import { MAX_FILE_SIZE } from "./constants";
import { PENDING_GUIDE_KEY } from "@/lib/constants";
import { fileToBase64 } from "./utils";
import type { PendingGuide } from "./types";

export type GuideRegisterT = (key: string) => string;

export type GuideRegisterSubmitFlowInput = {
  t: GuideRegisterT;
  walletAddress: string;
  city: string;
  countryCode: string;
  languages: string;
  serviceTypes: string;
  bio: string;
  realName: string;
  idNumber: string;
  idPhotoFile: File | null;
  pendingIdPhoto: string | null;
  languageCertFile: File | null;
  pendingLangCert: string | null;
  guideLicenseUrl: string;
  setError: (msg: string | null) => void;
  setDone: (v: boolean) => void;
  setIsAlreadyGuide: (v: boolean) => void;
  setRealName: (v: string) => void;
  setIdNumber: (v: string) => void;
  setPendingIdPhoto: (v: string | null) => void;
  setPendingLangCert: (v: string | null) => void;
  setIdPhotoFile: (v: File | null) => void;
  setLanguageCertFile: (v: File | null) => void;
  setLoading: (v: boolean) => void;
  setUploadPhase: (p: GuideRegisterUploadPhase) => void;
};

/**
 * Session/file uploads + `postGuide` + success field reset. Loading flag cleared in `finally`.
 * Preconditions (wallet/agree/files) validated by caller.
 */
export async function runGuideRegisterSubmitFlow(input: GuideRegisterSubmitFlowInput): Promise<void> {
  const {
    t,
    walletAddress,
    city,
    countryCode,
    languages,
    serviceTypes,
    bio,
    realName,
    idNumber,
    idPhotoFile,
    pendingIdPhoto,
    languageCertFile,
    pendingLangCert,
    guideLicenseUrl,
    setError,
    setDone,
    setIsAlreadyGuide,
    setRealName,
    setIdNumber,
    setPendingIdPhoto,
    setPendingLangCert,
    setIdPhotoFile,
    setLanguageCertFile,
    setLoading,
    setUploadPhase,
  } = input;

  try {
    clearGuideRegisterLastSubmitError();
    let idPhotoUrl: string | undefined;
    let languageCertUrl: string | undefined;
    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem(PENDING_GUIDE_KEY);
      if (raw) {
        let data: PendingGuide;
        try {
          data = JSON.parse(raw) as PendingGuide;
        } catch {
          data = {} as PendingGuide;
        }
        if (data.idPhotoUrl) idPhotoUrl = data.idPhotoUrl;
        if (data.languageCertUrl) languageCertUrl = data.languageCertUrl;
        if (!idPhotoUrl && data.idPhotoBase64) {
          try {
            const up = await postGuideUploadDoc({
              content_base64: data.idPhotoBase64,
              filename: data.idPhotoName,
            });
            if (up.url) {
              idPhotoUrl = up.url;
            } else {
              setError(t("guideRegister_pendingIdPhotoUploadFailed"));
              return;
            }
          } catch (err) {
            if (typeof window !== "undefined") {
              console.error("GuideRegister pending id photo upload:", err);
            }
            setError(mapApiReadError(err, t, "guideRegister_pendingIdPhotoUploadFailed"));
            return;
          }
        }
        if (data.languageCertBase64) {
          try {
            const up = await postGuideUploadDoc({
              content_base64: data.languageCertBase64,
              filename: data.languageCertName,
            });
            if (up.url) {
              languageCertUrl = up.url;
            } else {
              setError(t("guideRegister_pendingLangCertUploadFailed"));
              return;
            }
          } catch (err) {
            if (typeof window !== "undefined") {
              console.error("GuideRegister pending lang cert upload:", err);
            }
            setError(mapApiReadError(err, t, "guideRegister_pendingLangCertUploadFailed"));
            return;
          }
        }
      }
    }
    if (idPhotoFile) {
      const base64 = await fileToBase64(idPhotoFile, MAX_FILE_SIZE, t("guideRegister_fileTooBig"));
      const up = await postGuideUploadDoc({ content_base64: base64, filename: idPhotoFile.name });
      if (up.url) {
        idPhotoUrl = up.url;
      } else {
        setError(t("guideRegister_pendingIdPhotoUploadFailed"));
        return;
      }
    }
    if (languageCertFile) {
      const base64 = await fileToBase64(languageCertFile, MAX_FILE_SIZE, t("guideRegister_fileTooBig"));
      const up = await postGuideUploadDoc({ content_base64: base64, filename: languageCertFile.name });
      if (up.url) {
        languageCertUrl = up.url;
      } else {
        setError(t("guideRegister_pendingLangCertUploadFailed"));
        return;
      }
    }
    const needsPassportUrl = Boolean(idPhotoFile || pendingIdPhoto);
    if (needsPassportUrl && !idPhotoUrl) {
      setError(t("guideRegister_pendingPassportDataIncomplete"));
      return;
    }
    const licenseTrim = guideLicenseUrl.trim();
    if (
      licenseTrim &&
      (licenseTrim.length > GUIDE_LICENSE_URL_MAX_LEN || !guideLicenseUrlHasHttpScheme(licenseTrim))
    ) {
      setError(t("guideRegister_licenseUrlInvalid"));
      return;
    }
    setUploadPhase("submitting");
    const idemKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
    const langList = languages.trim()
      ? normalizeGuideLanguagesForWrite(languages.split(/[,，]/).map((s) => s.trim()).filter(Boolean))
      : undefined;
    const svcList = serviceTypes.trim()
      ? normalizeGuideServiceTypesForWrite(serviceTypes.split(/[,，]/).map((s) => s.trim()).filter(Boolean))
      : undefined;
    await postGuide(
      {
        city: city.trim(),
        country_code: countryCode.trim() || undefined,
        languages: langList?.length ? langList : undefined,
        service_types: svcList?.length ? svcList : undefined,
        bio: bio.trim() || undefined,
        wallet_address: walletAddress.trim() || undefined,
        real_name: realName.trim() || undefined,
        passport_number: idNumber.trim() || undefined,
        id_photo_url: idPhotoUrl,
        language_cert_url: languageCertUrl,
        guide_license_url: licenseTrim || undefined,
      },
      idemKey,
    );
    if (typeof window !== "undefined") window.sessionStorage.removeItem(PENDING_GUIDE_KEY);
    clearGuideRegisterDraft();
    clearGetMeCache();
    clearGuideRegisterLastSubmitError();
    setError(null);
    setDone(true);
    setRealName("");
    setIdNumber("");
    setPendingIdPhoto(null);
    setPendingLangCert(null);
    setIdPhotoFile(null);
    setLanguageCertFile(null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : t("guideRegister_errorSubmit");
    writeGuideRegisterLastSubmitError(msg);
    if (msg === "already_guide") {
      setIsAlreadyGuide(true);
      setError(null);
    } else if (msg === "kyc_required") setError(t("guideRegister_kycBlocked"));
    else if (msg === "guide_suspended") setError(t("guideRegister_suspendedTitle"));
    else if (msg === "guide_resubmit_not_allowed") setError(t("guideRegister_rejectedReapplyHint"));
    else if (msg === "invalid_wallet_address") setError(t("guideRegister_errorWallet"));
    else if (msg === "id_photo_required") setError(t("guideRegister_passportPhotoRequired"));
    else if (msg === "guide_license_url_invalid") setError(t("guideRegister_licenseUrlInvalid"));
    else if (msg === "city_required") setError(t("guideRegister_errorCity"));
    else if (msg === "city_too_long") setError(t("guideRegister_errorCityTooLong"));
    else if (msg === "file_too_large" || (typeof msg === "string" && msg.startsWith("file_too_large")))
      setError(t("guideRegister_fileTooBig"));
    else if (msg === "invalid_file_type") setError(t("guideRegister_errorFileType"));
    else if (msg === "guide_db_persist_failed") setError(t("guideRegister_guideDbUnavailable"));
    else {
      if (typeof window !== "undefined") {
        console.error("GuideRegister:", err);
      }
      setError(mapApiReadError(err, t, "guideRegister_errorSubmit"));
    }
  } finally {
    setUploadPhase("idle");
    setLoading(false);
  }
}
