import { mapApiReadError } from "@/lib/mapApiReadError";

export type WalletVerifyErrorStage = "precheck" | "challenge" | "sign" | "confirm";

/** Map wallet verify failures to user-visible copy; distinguish API vs MetaMask stages. */
export function resolveGuideRegisterWalletVerifyError(
  err: unknown,
  t: (key: string) => string,
  stage: WalletVerifyErrorStage,
): string {
  const code = err instanceof Error ? err.message : String(err ?? "");

  if (
    code === "login_required" ||
    code === "unauthorized" ||
    code === "request_failed_401" ||
    /^请求失败 401$/i.test(code)
  ) {
    return t("guideRegister_walletVerifyNeedSiteLogin");
  }
  if (/user rejected|denied|cancelled|canceled/i.test(code)) {
    return t("guideRegister_walletSignRejected");
  }
  if (code === "wallet_signature_mismatch") return t("guideRegister_walletSignatureMismatch");
  if (code === "invalid_or_expired_wallet_challenge") return t("guideRegister_walletChallengeExpired");
  if (code === "db_error" || code === "session_db_unavailable") {
    return t("guideRegister_walletVerifyServerError");
  }
  if (
    code === "api_html_not_json" ||
    code === "Failed to fetch" ||
    /failed to fetch|networkerror|load failed/i.test(code)
  ) {
    return t("guideRegister_walletVerifyApiUnavailable");
  }
  if (/ConnectorNotConnected|connector not connected|no connector/i.test(code)) {
    return t("guideRegister_walletSignConnectorLost");
  }
  if (stage === "precheck") return t("guideRegister_walletVerifyNeedSiteLogin");
  if (stage === "sign") {
    return mapApiReadError(err, t, "guideRegister_walletSignFailed");
  }
  if (stage === "challenge") {
    return mapApiReadError(err, t, "guideRegister_walletVerifyChallengeFailed");
  }
  return mapApiReadError(err, t, "guideRegister_walletVerifyFailed");
}
