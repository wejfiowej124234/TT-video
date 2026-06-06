/**
 * **认证 API**（**`crates/api/src/routes/auth.rs`**；**48** §2.2；**04** §3.4）。
 *
 * **chain_off**：**`POST /auth/register|login|logout|refresh|verify-email|forgot-password|reset-password`** 在 **无 `chain_off`** 时 **503** 根级 **`chain_off_unavailable`**（**`parseResponse`** → 抛 **`chain_off_unavailable`**）。**`POST /auth/seed-test-accounts`**：**`SEED_TEST_ACCOUNTS≠1`** → **403** **`seed_test_accounts_disabled`**；**无 `chain_off`** 且 env 允许时仍 **503**（本客户端 **`postSeedTestAccounts`** 将任意 **!res.ok** 归为 **`{ disabled: true }`**，**不**抛）。
 * **51-H2 / 51-B1**：verify/forgot/reset 在链上实现落地前多为 stub；前端照常 **`parseResponse` + `throwUnlessApiOk`**。
 */

export {
  applyLocalLogoutAfterServerOk,
  applyClientSessionAfterAuth,
  syncClientSessionUserIdCookieFromStorage,
} from "./sessionSideEffects";
export {
  postSeedTestAccounts,
  postLogin,
  postRegister,
  postRegisterSendVerificationCode,
  postLogout,
  postRefresh,
  postVerifyEmail,
  postResendVerificationEmail,
  postForgotPassword,
  postResetPassword,
} from "./http";
