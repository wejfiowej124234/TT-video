/**
 * GUIDE-ONBOARDING-STEP3-P0-DEBUG — 向导入驻 Step3 诊断（① local · 真实用户账号）
 */
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  type BearerSessionCredentials,
} from "./apiSession";
import {
  assertNotSeedEmail,
  makeRealUserPair,
  REAL_USER_PASSWORD,
  registerFreshAccountViaUi,
} from "./realUserAcceptanceCorridor";

export type GuideRegisterStep3DebugSnapshot = {
  submitDisabled: boolean;
  submitDisabledReasons: Record<string, boolean>;
  validation: {
    step1Field: string | null;
    step1MessageKey: string | null;
    step2Field: string | null;
    step2MessageKey: string | null;
  };
  upload: {
    phase: string;
    idPhotoFileName: string | null;
    idPhotoFileSize: number | null;
    pendingIdPhoto: string | null;
    languageCertFileName: string | null;
  };
  postGuideWillFire: boolean;
  postGuidePipeline: string;
  isLoggedIn: boolean | null;
  agreePrivacy: boolean;
  walletVerified: boolean;
  error: string | null;
  fieldError: string | null;
  lastSubmitErrorRaw?: string | null;
};

export type GuideStep3NetworkEvent = {
  phase: "upload-doc" | "post-guides" | "other";
  method: string;
  url: string;
  status: number | null;
  ok: boolean;
};

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const GUIDE_WALLET = `0x${"a".repeat(40)}`;

const PASSPORT_FILE_PAYLOAD = {
  name: "passport.png",
  mimeType: "image/png" as const,
  buffer: TINY_PNG,
};

async function isGuidePassportPhotoSelected(form: Locator): Promise<boolean> {
  if (await form.getByRole("button", { name: /清除文件|Clear file/i }).isVisible().catch(() => false)) {
    return true;
  }
  if (await form.getByText(/passport\.png/i).isVisible().catch(() => false)) {
    return true;
  }
  if (
    await form
      .locator('img[class*="rounded-lg"][class*="border"]')
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return true;
  }
  return false;
}

/** Playwright setInputFiles alone can miss React onChange; filechooser + retries for full sprint stability. */
export async function pickGuidePassportPhotoInForm(form: Locator): Promise<void> {
  const passportInput = form.locator("input#guide-reg-passport-photo");
  await expect(passportInput).toBeAttached({ timeout: 30_000 });
  const page = form.page();
  const dropZone = passportInput.locator("xpath=..");

  for (let attempt = 0; attempt < 3; attempt++) {
    if (await isGuidePassportPhotoSelected(form)) return;

    try {
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 15_000 }),
        dropZone.click({ timeout: 15_000, force: true }),
      ]);
      await chooser.setFiles(PASSPORT_FILE_PAYLOAD);
    } catch {
      await passportInput.setInputFiles(PASSPORT_FILE_PAYLOAD);
      await passportInput.evaluate((el: HTMLInputElement) => {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }

    try {
      await expect.poll(async () => isGuidePassportPhotoSelected(form), { timeout: 25_000 }).toBe(true);
      return;
    } catch {
      if (attempt === 2) {
        throw new Error("guide register passport photo upload did not stick after 3 attempts");
      }
    }
  }
}

export async function readGuideRegisterStep3Debug(
  page: Page,
): Promise<GuideRegisterStep3DebugSnapshot | null> {
  const raw = await page
    .locator('[data-tt-guide-register-form="1"]')
    .getAttribute("data-tt-guide-register-step3-debug");
  if (!raw) return null;
  return JSON.parse(raw) as GuideRegisterStep3DebugSnapshot;
}

export function formatGuideStep3DebugReport(
  label: string,
  snap: GuideRegisterStep3DebugSnapshot | null,
  network: GuideStep3NetworkEvent[],
  alertText: string | null,
): string {
  const lines = [
    `=== GUIDE-ONBOARDING-STEP3-P0-DEBUG · ${label} ===`,
    snap
      ? `submitDisabled: ${snap.submitDisabled}`
      : "submitDisabled: (no step3 debug attr — not on step 3?)",
  ];
  if (snap) {
    lines.push(
      `submitDisabledReasons: ${JSON.stringify(snap.submitDisabledReasons)}`,
      `validation: step1=${snap.validation.step1Field ?? "ok"} (${snap.validation.step1MessageKey ?? "—"}) · step2=${snap.validation.step2Field ?? "ok"} (${snap.validation.step2MessageKey ?? "—"})`,
      `upload: phase=${snap.upload.phase} file=${snap.upload.idPhotoFileName ?? "—"} size=${snap.upload.idPhotoFileSize ?? "—"} pending=${snap.pendingIdPhoto ?? "—"}`,
      `postGuideWillFire: ${snap.postGuideWillFire}`,
      `postGuidePipeline: ${snap.postGuidePipeline}`,
      `session: isLoggedIn=${snap.isLoggedIn} agreePrivacy=${snap.agreePrivacy} walletVerified=${snap.walletVerified}`,
      `uiError: ${snap.error ?? "—"} fieldError=${snap.fieldError ?? "—"}`,
      `lastSubmitErrorRaw: ${snap.lastSubmitErrorRaw ?? "—"}`,
    );
  }
  if (alertText) lines.push(`alertText: ${alertText}`);
  if (network.length) {
    lines.push("network:");
    for (const n of network) {
      lines.push(`  - [${n.phase}] ${n.method} ${n.status ?? "?"} ${n.url}`);
    }
  } else {
    lines.push("network: (no /api/v1/guides* POST observed)");
  }
  return lines.join("\n");
}

export function attachGuideStep3NetworkTap(page: Page): {
  events: GuideStep3NetworkEvent[];
  dispose: () => void;
} {
  const events: GuideStep3NetworkEvent[] = [];
  const onResponse = (res: {
    url: () => string;
    request: () => { method: () => string };
    status: () => number;
    ok: () => boolean;
  }) => {
    const url = res.url();
    if (!url.includes("/api/v1/guides")) return;
    const method = res.request().method();
    if (method !== "POST") return;
    const phase: GuideStep3NetworkEvent["phase"] = url.includes("upload-doc")
      ? "upload-doc"
      : /\/api\/v1\/guides\/?(\?|$)/.test(new URL(url).pathname)
        ? "post-guides"
        : "other";
    events.push({
      phase,
      method,
      url,
      status: res.status(),
      ok: res.ok(),
    });
  };
  page.on("response", onResponse);
  return {
    events,
    dispose: () => page.off("response", onResponse),
  };
}

const GUIDE_REGISTER_WALLET_STORAGE_KEY = "traveltrust_guide_register_wallet_verified_v1";

export async function injectGuideRegisterWalletVerifiedInitScript(page: Page): Promise<void> {
  await page.addInitScript(
    ({ wallet, storageKey }) => {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ address: wallet, at: Date.now() }),
      );
    },
    { wallet: GUIDE_WALLET, storageKey: GUIDE_REGISTER_WALLET_STORAGE_KEY },
  );
}

export async function fillGuideRegisterSteps1And2ViaUi(
  page: Page,
  opts?: { skipInitialGoto?: boolean },
): Promise<void> {
  if (!opts?.skipInitialGoto) {
    await injectGuideRegisterWalletVerifiedInitScript(page);
    await page.goto("/guide/register?step=1", { timeout: 60_000 });
  }
  const form = page.locator('[data-tt-guide-register-form="1"]');
  await expect(form).toBeVisible({ timeout: 120_000 });
  await expect(form.locator('[data-tt-guide-register-wallet-input="1"]')).toBeVisible({
    timeout: 60_000,
  });

  await form.locator('[data-tt-guide-register-wallet-input="1"]').fill(GUIDE_WALLET);
  await expect(form.getByText(/钱包已验证|Wallet verified/i)).toBeVisible({ timeout: 30_000 });

  await form.getByPlaceholder(/与护照一致|passport/i).fill(`Real Guide ${Date.now().toString(36)}`);
  await form.getByPlaceholder(/护照号|Passport number/i).fill(`P${Date.now().toString().slice(-8)}`);
  await pickGuidePassportPhotoInForm(form);

  await form.getByRole("button", { name: /下一步|Next/i }).click();
  await expect(form.locator("#guide-reg-country")).toBeVisible({ timeout: 60_000 });

  await form.locator("#guide-reg-country").selectOption("CN");
  const citySelect = form.locator("#guide-reg-city");
  if (await citySelect.evaluate((el) => el.tagName.toLowerCase() === "select")) {
    const beijingValue = await citySelect
      .locator("option")
      .filter({ hasText: /北京|Beijing/i })
      .first()
      .getAttribute("value");
    if (beijingValue) {
      await citySelect.selectOption(beijingValue);
    } else {
      await citySelect.selectOption({ index: 1 });
    }
  } else {
    await citySelect.fill("北京");
  }

  await form.getByRole("button", { name: /^中文$|^Chinese$/ }).click();
  await form.getByRole("button", { name: /^向导服务$|^Guide service$/i }).click();
  await form.locator("#guide-reg-bio").fill(`Step3 debug guide ${Date.now()}`);

  await form.getByRole("button", { name: /下一步|Next/i }).click();
  await expect(form.locator('[data-tt-guide-register-submit="1"]')).toBeVisible({
    timeout: 60_000,
  });
}

/** 真实 `@traveltrust.acceptance` 账号 · API 注册（Step3 调试专用，跳过 5min+ UI 注册） */
export async function registerFreshGuideAccountViaApi(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<BearerSessionCredentials> {
  assertNotSeedEmail(email);
  const base = apiBase.replace(/\/$/, "");
  const sendRes = await request.post(`${base}/auth/register/send-verification-code`, {
    headers: { "Content-Type": "application/json" },
    data: { email },
  });
  expect(sendRes.ok(), `send-verification-code failed: ${await sendRes.text()}`).toBeTruthy();
  const sendJson = (await sendRes.json()) as { registration_verification_dev_code?: string };
  const code = String(sendJson.registration_verification_dev_code ?? "").trim();
  expect(code.length, "missing registration_verification_dev_code").toBe(6);

  const regRes = await request.post(`${base}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: {
      email,
      password,
      verification_code: code,
      nickname: `GuideStep3 ${Date.now().toString(36)}`,
    },
  });
  expect(regRes.ok(), `auth/register failed: ${await regRes.text()}`).toBeTruthy();

  const creds = await apiLoginReturnCredentials(request, base, email, password);
  expect(creds?.token, "login after register returned no token").toBeTruthy();
  return creds!;
}

export async function prepareFreshGuideAccountForStep3(
  page: Page,
  request: APIRequestContext,
  apiBase: string,
  opts?: { viaUiRegister?: boolean },
): Promise<{ guideEmail: string; guidePassword: string }> {
  const pair = makeRealUserPair();
  assertNotSeedEmail(pair.guideEmail);
  const health = await request.get(`${apiBase.replace(/\/$/, "")}/health`).catch(() => null);
  expect(health?.ok(), `API down: ${apiBase}/health`).toBeTruthy();

  if (opts?.viaUiRegister) {
    await registerFreshAccountViaUi(page, pair.guideEmail, pair.guidePassword, "guide");
    return { guideEmail: pair.guideEmail, guidePassword: pair.guidePassword };
  }

  const creds = await registerFreshGuideAccountViaApi(
    request,
    apiBase,
    pair.guideEmail,
    pair.guidePassword,
  );
  await page.addInitScript(
    ([tok, uid, wallet, storageKey]) => {
      try {
        sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
        localStorage.setItem("traveltrust_session_token", tok);
        if (uid) {
          localStorage.setItem("traveltrust_user_id", uid);
          document.cookie = `traveltrust_user_id=${encodeURIComponent(uid)}; Path=/; SameSite=Lax`;
        }
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ address: wallet, at: Date.now() }),
        );
      } catch {
        /* ignore */
      }
    },
    [creds.token, creds.userId ?? "", GUIDE_WALLET, GUIDE_REGISTER_WALLET_STORAGE_KEY] as [
      string,
      string,
      string,
      string,
    ],
  );
  return { guideEmail: pair.guideEmail, guidePassword: pair.guidePassword };
}

export { REAL_USER_PASSWORD };

export async function probeGuideUploadDocFromBrowser(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(async () => {
    const tok = localStorage.getItem("traveltrust_session_token") ?? "";
    const idem = crypto.randomUUID();
    try {
      const r = await fetch("/api/v1/guides/upload-doc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
          "Idempotency-Key": idem,
          "X-Idempotency-Key": idem,
        },
        body: JSON.stringify({
          content_base64:
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          filename: "probe.png",
        }),
      });
      const text = await r.text();
      return { ok: r.ok, status: r.status, text: text.slice(0, 400) };
    } catch (e) {
      return { fetchError: e instanceof Error ? e.message : String(e) };
    }
  });
}

export async function logGuideStep3DebugState(
  page: Page,
  label: string,
  network: GuideStep3NetworkEvent[],
): Promise<GuideRegisterStep3DebugSnapshot | null> {
  const snap = await readGuideRegisterStep3Debug(page);
  const agreeWrapCount = await page.locator('[data-tt-guide-register-agree-wrap="1"]').count();
  const step3CheckboxCount = await page
    .locator('section[aria-labelledby="guide-reg-step3-title"] [role="checkbox"]')
    .count();
  const alertLoc = page.locator('[data-tt-guide-register-form="1"] [role="alert"]');
  const alertText =
    (await alertLoc.count()) > 0
      ? ((await alertLoc.first().textContent({ timeout: 2_000 }).catch(() => null))?.trim() ?? null)
      : null;
  // eslint-disable-next-line no-console
  console.log(
    `${formatGuideStep3DebugReport(label, snap, network, alertText?.trim() || null)}\n` +
      `dom: agreeWrap=${agreeWrapCount} step3Checkbox=${step3CheckboxCount}`,
  );
  return snap;
}
