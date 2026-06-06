import { PROTOCOL_SSOT_V1, isValidProtocolJurisdictionId } from "@/lib/governance/protocolSsot.v1";

export type StewardRegisterStep = 1 | 2 | 3;

export type StewardRegisterFieldKey = "jurisdictions" | "legalName" | "contactEmail" | "wallet" | "motivation";

export type StewardRegisterForm = {
  jurisdictions: string[];
  legal_name: string;
  contact_email: string;
  wallet_address: string;
  motivation: string;
};

export type StewardRegisterValidationResult =
  | { ok: true }
  | { ok: false; code: string };

export type StewardRegisterValidationFailure = {
  messageKey: string;
  field: StewardRegisterFieldKey;
};

const WALLET_RE = /^0x[0-9a-fA-F]{40}$/;

export function parseStewardRegisterStepParam(raw: string | null): StewardRegisterStep {
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (n === 2 || n === 3) return n;
  return 1;
}

export function validateStewardRegisterStep1(jurisdictions: string[]): StewardRegisterValidationFailure | null {
  const ids = [...new Set(jurisdictions.map((j) => j.trim().toUpperCase()).filter(Boolean))];
  if (ids.length === 0) {
    return { messageKey: STEWARD_REGISTER_ERROR_KEYS.jurisdictions_required, field: "jurisdictions" };
  }
  for (const j of ids) {
    if (!isValidProtocolJurisdictionId(j)) {
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.invalid_jurisdiction, field: "jurisdictions" };
    }
  }
  return null;
}

/** 第 2 步「下一步」灰掉原因（用于 CTA 提示，与 validateStewardRegisterStep2 同源） */
export type StewardRegisterStep2BlockReason =
  | "legal_name"
  | "contact_email"
  | "wallet"
  | "wallet_verify"
  | null;

export function stewardRegisterStep2BlockReason(input: {
  legal_name: string;
  contact_email: string;
  wallet_address: string;
  wallet_verified: boolean;
}): StewardRegisterStep2BlockReason {
  if (!input.legal_name.trim()) return "legal_name";
  if (!input.contact_email.trim() || !input.contact_email.includes("@")) return "contact_email";
  if (!WALLET_RE.test(input.wallet_address.trim())) return "wallet";
  if (!input.wallet_verified) return "wallet_verify";
  return null;
}

export function validateStewardRegisterStep2(input: {
  legal_name: string;
  contact_email: string;
  wallet_address: string;
  wallet_verified?: boolean;
}): StewardRegisterValidationFailure | null {
  const reason = stewardRegisterStep2BlockReason({
    legal_name: input.legal_name,
    contact_email: input.contact_email,
    wallet_address: input.wallet_address,
    wallet_verified: input.wallet_verified === true,
  });
  switch (reason) {
    case "legal_name":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.legal_name_required, field: "legalName" };
    case "contact_email":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.contact_email_invalid, field: "contactEmail" };
    case "wallet":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.wallet_invalid, field: "wallet" };
    case "wallet_verify":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.wallet_verify_required, field: "wallet" };
    default:
      return null;
  }
}

export type StewardRegisterStepInput = {
  jurisdictions: string[];
  legal_name: string;
  contact_email: string;
  wallet_address: string;
  wallet_verified?: boolean;
};

/** 根据已填数据计算可达 wizard 步（防 ?step=3 空表单深链） */
export function stewardRegisterMaxReachableStep(input: StewardRegisterStepInput): StewardRegisterStep {
  if (validateStewardRegisterStep1(input.jurisdictions)) return 1;
  if (
    validateStewardRegisterStep2({
      legal_name: input.legal_name,
      contact_email: input.contact_email,
      wallet_address: input.wallet_address,
      wallet_verified: input.wallet_verified,
    })
  ) {
    return 2;
  }
  return 3;
}

export function clampStewardRegisterStep(
  requested: StewardRegisterStep,
  input: StewardRegisterStepInput,
): StewardRegisterStep {
  const max = stewardRegisterMaxReachableStep(input);
  return requested <= max ? requested : max;
}

export function stewardRegisterValidationFailureFromCode(code: string): StewardRegisterValidationFailure | null {
  switch (code) {
    case "jurisdictions_required":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.jurisdictions_required, field: "jurisdictions" };
    case "invalid_jurisdiction":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.invalid_jurisdiction, field: "jurisdictions" };
    case "legal_name_required":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.legal_name_required, field: "legalName" };
    case "contact_email_invalid":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.contact_email_invalid, field: "contactEmail" };
    case "wallet_invalid":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.wallet_invalid, field: "wallet" };
    case "wallet_verify_required":
      return { messageKey: STEWARD_REGISTER_ERROR_KEYS.wallet_verify_required, field: "wallet" };
    default:
      return null;
  }
}

export function validateStewardRegisterForm(
  form: StewardRegisterForm,
  opts?: { wallet_verified?: boolean },
): StewardRegisterValidationResult {
  const step1 = validateStewardRegisterStep1(form.jurisdictions);
  if (step1) {
    const code =
      step1.messageKey === STEWARD_REGISTER_ERROR_KEYS.invalid_jurisdiction
        ? "invalid_jurisdiction"
        : "jurisdictions_required";
    return { ok: false, code };
  }
  const step2 = validateStewardRegisterStep2({
    legal_name: form.legal_name,
    contact_email: form.contact_email,
    wallet_address: form.wallet_address,
    wallet_verified: opts?.wallet_verified,
  });
  if (step2) {
    const code =
      step2.field === "legalName"
        ? "legal_name_required"
        : step2.field === "contactEmail"
          ? "contact_email_invalid"
          : step2.messageKey === STEWARD_REGISTER_ERROR_KEYS.wallet_verify_required
            ? "wallet_verify_required"
            : "wallet_invalid";
    return { ok: false, code };
  }
  return { ok: true };
}

export function stewardJurisdictionOptions() {
  return PROTOCOL_SSOT_V1.jurisdictions.map((j) => ({
    id: j.id,
    label: `${j.id} · ${j.steward_stake_bps / 100}% TTG`,
    steward_stake_bps: j.steward_stake_bps,
  }));
}

export function isStewardAlreadyActive(role: string | undefined | null): boolean {
  return role === "region_steward";
}

export function isStewardApplicationPending(status: string | undefined | null): boolean {
  return status === "stake_pending" || status === "under_review";
}

export function isStewardApplicationRejected(status: string | undefined | null): boolean {
  return status === "rejected";
}

export const STEWARD_REGISTER_ERROR_KEYS: Record<string, string> = {
  legal_name_required: "steward_register_error_legalName",
  contact_email_invalid: "steward_register_error_email",
  wallet_invalid: "steward_register_error_wallet",
  wallet_verify_required: "steward_register_error_walletVerify",
  jurisdictions_required: "steward_register_error_jurisdictions",
  invalid_jurisdiction: "steward_register_error_jurisdiction",
  submit_failed: "steward_register_error_submit",
};
