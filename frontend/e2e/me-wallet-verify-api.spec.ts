/**
 * 钱包验签 API 烟测：**challenge → confirm → verification-status**（EIP-191；须 **DATABASE_URL**）。
 * 与 **`me_wallet_verify_db_api_tests`**、**`/me/security`** UI 互补。
 */
import { test, expect } from "@playwright/test";

import { apiLoginReturnCredentials, defaultApiBase } from "./helpers/apiSession";
import { requestGetWith429Retry, requestPostWith429Retry } from "./helpers/playwright429Backoff";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { e2eWalletVerifyAccount, signEip191PersonalMessage } from "./helpers/walletVerifySign";

const API_BASE = defaultApiBase();
const WALLET = e2eWalletVerifyAccount.address;

function bearer(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

test.describe("me wallet verify API (EIP-191)", () => {
  test("challenge → sign → confirm → status verified", async ({ request }) => {
    await skipIfApiDown(request);

    const stamp = Date.now();
    const email = `e2e-wallet-verify-${stamp}@traveltrust.test`;
    const password = "Test123!";

    const reg = await requestPostWith429Retry(request, `${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password, nickname: `wv-${stamp}` },
    });
    if (!reg.ok()) {
      test.skip(true, `register failed HTTP ${reg.status()} — ${(await reg.text()).slice(0, 200)}`);
    }

    const creds = await apiLoginReturnCredentials(request, API_BASE, email, password);
    if (!creds?.token) {
      test.skip(true, "login after register failed — need DATABASE_URL + chain_off");
    }

    const challengeRes = await requestPostWith429Retry(
      request,
      `${API_BASE}/api/v1/me/wallet/verify/challenge`,
      {
        headers: bearer(creds.token),
        data: { wallet_address: WALLET },
      },
    );
    const challengeTxt = await challengeRes.text();
    if (challengeRes.status() === 503 && challengeTxt.includes("session_db_unavailable")) {
      test.skip(true, "wallet verify requires PG (DATABASE_URL on API)");
    }
    expect(
      challengeRes.ok(),
      `challenge HTTP ${challengeRes.status()} body=${challengeTxt.slice(0, 300)}`,
    ).toBeTruthy();

    const challenge = JSON.parse(challengeTxt) as {
      status?: string;
      challenge_id?: string;
      message?: string;
    };
    expect(challenge.status).toBe("ok");
    expect(challenge.challenge_id).toBeTruthy();
    expect(challenge.message).toBeTruthy();

    const signature = await signEip191PersonalMessage(challenge.message!);

    const confirmRes = await requestPostWith429Retry(
      request,
      `${API_BASE}/api/v1/me/wallet/verify/confirm`,
      {
        headers: bearer(creds.token),
        data: { challenge_id: challenge.challenge_id, signature },
      },
    );
    const confirmTxt = await confirmRes.text();
    expect(
      confirmRes.ok(),
      `confirm HTTP ${confirmRes.status()} body=${confirmTxt.slice(0, 300)}`,
    ).toBeTruthy();
    const confirmBody = JSON.parse(confirmTxt) as { status?: string; verified?: boolean };
    expect(confirmBody.status).toBe("ok");
    expect(confirmBody.verified).toBe(true);

    const statusRes = await requestGetWith429Retry(
      request,
      `${API_BASE}/api/v1/me/wallet/verification-status`,
      { headers: { Authorization: `Bearer ${creds.token}` } },
    );
    const statusTxt = await statusRes.text();
    expect(statusRes.ok(), `status HTTP ${statusRes.status()}`).toBeTruthy();
    const statusBody = JSON.parse(statusTxt) as {
      verified?: boolean;
      wallet_address?: string;
      verification_method?: string;
    };
    expect(statusBody.verified).toBe(true);
    expect(statusBody.wallet_address?.toLowerCase()).toBe(WALLET.toLowerCase());
    expect(statusBody.verification_method).toBe("eip191_personal_sign");
  });
});
