/** `lib/apiClient/meta/` — 与 GET /meta 响应形状相关的 TypeScript 类型（04 §7.10 等）。 */

/** `GET /meta.build`（04 §7.10、120/140） */
export type MetaBuildInfo = {
  git_sha: string;
  deployed_at: string | null;
};

/** `GET /meta.product_roles`（87 / 04 §二 2.1 / 690 / 691 / 692） */
export type ProductRolesMeta = {
  users_role_stored: string[];
  me_public_role_mapping: Record<string, string>;
  protocol_roles_target_87: string[];
  provider_in_users_role: boolean;
  region_steward_in_users_role: boolean;
  rule: string;
};

/** `GET /meta.auth.registration`（693 / 694 / 695 / 697，与 `POST /auth/register` 可选 `role` 同源） */
export type AuthRegistrationMeta = {
  self_serve_roles_allowed: string[];
  /** 请求体别名 → `users.role` 存储值（**697** 起常为空对象；**695** 曾为 `traveler`→`tourist`） */
  request_role_aliases: Record<string, string>;
  default_role: string;
  invalid_role_error_key: string;
  arbitrator_seed_env: string;
  guide_via_separate_flow_only: boolean;
  rule: string;
};
