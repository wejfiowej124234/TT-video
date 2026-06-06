/**
 * **个人中心**（**`crates/api/src/routes/me.rs`**；**48** §2.2；**04** §3.4）。
 *
 * **`GET /me`**：**无 `chain_off`** → **200** **`anonymous`/`guest`** 占位体（**非** **503**）；**有 `chain_off`** → 须会话，否则 **401**；用户不在 store 时后端可将 **404** 转为 **401**（前端 **`getMe`** 将 **401** 视为未登录 **`null`**）。
 * **`GET /me/stats`**：**无 `chain_off`** → **200** 占位 **`stats`** + **`note`**；**有 `chain_off`** 须登录。
 * **`PUT /me`**、**`PUT /me/password`**：**无 `chain_off`** → **503** **`chain_off_unavailable`**；须登录路径见实现。
 * 会话/安全子路径见 **`meSecurity.ts`**（**无 `chain_off`** → **503**；无 PG 时部分端点 **200** 空 **`items`** + **`meta`**）。
 */

export {
  isMeFullFetchSkippedByDevEnv,
  getMe,
  clearGetMeCache,
  getMeFull,
  isMeFullRequestError,
} from "./meFetch";
export type { GetMeFullOptions } from "./meFetch";
export { getMeStats, putMe, putMePassword, postMeProfileAvatar } from "./meWrite";
export {
  getWalletVerificationStatus,
  postWalletVerifyChallenge,
  postWalletVerifyConfirm,
} from "./meWalletVerify";
export type {
  WalletVerificationStatus,
  WalletVerifyChallengeResponse,
} from "./meWalletVerify";
