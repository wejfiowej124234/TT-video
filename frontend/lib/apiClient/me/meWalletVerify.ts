import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";

export type WalletVerificationStatus = {
  status: string;
  verified: boolean;
  verification_method?: string;
  wallet_address?: string;
  checked_at?: string;
  verification_ttl_seconds?: number;
  verification_age_seconds?: number;
};

export type WalletVerifyChallengeResponse = {
  status: string;
  challenge_id: string;
  message: string;
  expires_at: string;
};

export async function postWalletVerifyChallenge(body: {
  wallet_address: string;
}): Promise<WalletVerifyChallengeResponse> {
  const res = await fetch(apiUrl(routes.meWalletVerifyChallenge), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postWalletVerifyChallenge", data);
  throwUnlessApiOk(data);
  return data as WalletVerifyChallengeResponse;
}

export async function postWalletVerifyConfirm(body: {
  challenge_id: string;
  signature: string;
}): Promise<{ status: string; verified?: boolean; wallet_address?: string }> {
  const res = await fetch(apiUrl(routes.meWalletVerifyConfirm), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postWalletVerifyConfirm", data);
  throwUnlessApiOk(data);
  return data as { status: string; verified?: boolean; wallet_address?: string };
}

export async function getWalletVerificationStatus(): Promise<WalletVerificationStatus> {
  const res = await fetch(apiUrl(routes.meWalletVerificationStatus), {
    headers: { "x-request-id": requestId(), ...writeRequestHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getWalletVerificationStatus", data);
  throwUnlessApiOk(data);
  return data as WalletVerificationStatus;
}
