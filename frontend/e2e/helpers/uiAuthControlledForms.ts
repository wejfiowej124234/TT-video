import { expect, type Locator, type Response } from "@playwright/test";

/**
 * 登录页受控输入：`fill`+`click` 在 Next/React 下偶发不触发带 body 的 `POST /auth/login`；
 * 与 `93-matrix-enterprise-p1-batch` A-LOG-001 同源（逐键 + 显式提交）。
 *
 * 表单缩在 `loginContext`（`[data-tt-auth-route="login"]`）下，避免误绑别页残留；密码勿用宽 `getByLabel(/password/)`。
 */
export async function fillAndSubmitLoginForm(loginContext: Locator, email: string, password: string): Promise<void> {
  const page = loginContext.page();
  const form = loginContext.locator('form[data-tt-auth-surface="login_form"]').first();
  await expect(form).toBeVisible({ timeout: 90_000 });
  /**
   * `LoginForm` mount 即 `postSeedTestAccounts`；与逐键竞态时偶发 **POST body email 空串**（API `[login] … ""`）。
   */
  await page
    .waitForResponse(
      (r) =>
        r.url().includes("/auth/seed-test-accounts") &&
        r.request().method() === "POST" &&
        r.status() < 500,
      { timeout: 90_000 },
    )
    .catch(() => {});
  const emailBox = form.locator('input[type="email"]');
  const passwordBox = form.locator('input[type="password"]');
  /**
   * `fill` 偶发赶不上 React 受控 state → `onSubmit` 读到空串；逐键 + 点「登录」与 A-LOG-001 负例对齐。
   */
  await emailBox.click();
  await emailBox.pressSequentially(email, { delay: 22 });
  await passwordBox.click();
  await passwordBox.pressSequentially(password, { delay: 22 });
  await expect(emailBox).toHaveValue(email, { timeout: 90_000 });
  await expect(passwordBox).toHaveValue(password, { timeout: 90_000 });
  await page.waitForFunction(
    ([wantEmail, wantPassword]) => {
      const el = document.querySelector('form[data-tt-auth-surface="login_form"]');
      if (!(el instanceof HTMLFormElement)) return false;
      const em = el.querySelector<HTMLInputElement>('input[type="email"]');
      const pw = el.querySelector<HTMLInputElement>('input[type="password"]');
      return em?.value === wantEmail && pw?.value === wantPassword;
    },
    [email, password] as const,
    { timeout: 90_000 },
  );
  await form.locator('[data-tt-auth-login-submit="1"]').click();
}

/** 注册页字段区（`RegisterTouristForm` / `register_form_fields`） */
export async function fillAndClickRegisterForm(
  registerShell: Locator,
  email: string,
  password: string,
): Promise<void> {
  const form = registerShell.locator('form[data-tt-auth-surface="register_form_fields"]');
  await expect(form).toBeVisible({ timeout: 90_000 });
  const emailBox = form.getByRole("textbox", { name: /email|邮箱/i });
  await emailBox.click();
  await emailBox.clear();
  await emailBox.pressSequentially(email, { delay: 15 });
  const passFirst = form.getByLabel(/password|密码/i).first();
  await passFirst.click();
  await passFirst.clear();
  await passFirst.pressSequentially(password, { delay: 15 });
  const confirm = form.getByLabel(/confirm|确认/i);
  await confirm.click();
  await confirm.clear();
  await confirm.pressSequentially(password, { delay: 15 });
  await expect(emailBox).toHaveValue(email, { timeout: 90_000 });
  await expect(passFirst).toHaveValue(password, { timeout: 90_000 });
  await expect(confirm).toHaveValue(password, { timeout: 90_000 });
  const page = registerShell.page();
  const submit = form.locator('[data-tt-auth-register-submit="1"]').first();
  await expect(submit).toBeEnabled({ timeout: 90_000 });
  const postRegister = (r: Response): boolean => {
    if (r.request().method() !== "POST") return false;
    try {
      const p = new URL(r.url()).pathname.replace(/\/+$/, "");
      return p.endsWith("/auth/register");
    } catch {
      return false;
    }
  };
  /** 与 click 同拍，避免响应在「注册监听器」与「点击」之间落完导致全矩阵长尾假红。 */
  const [resp] = await Promise.all([
    page.waitForResponse(postRegister, { timeout: 240_000 }),
    submit.click(),
  ]);
  if (!resp.ok()) {
    const snippet = (await resp.text().catch(() => "")).slice(0, 800);
    throw new Error(`POST /auth/register HTTP ${resp.status()}: ${snippet}`);
  }
}
