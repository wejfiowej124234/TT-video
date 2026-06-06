import { postResendVerificationEmail } from "@/lib/apiClient";

/** 设置族 · 重发邮箱验证（① chain_off 可返回 `email_verification_dev_token`） */
export async function resendMeSettingsVerificationEmail(): Promise<{
  devToken: string | null;
  message: string | null;
}> {
  const data = await postResendVerificationEmail();
  const devToken =
    typeof data.email_verification_dev_token === "string"
      ? data.email_verification_dev_token
      : null;
  const message = typeof data.message === "string" ? data.message : null;
  return { devToken, message };
}
