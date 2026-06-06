/**
 * P2：`/community/me` 相关前端特性开关（构建时 `NEXT_PUBLIC_*`）。
 * **赞过列表**：未设置 env = **默认开启**；显式 `…=0` 关闭。
 * **bio**：development 未设 env 时**默认开启**；显式 `0` 关闭；**production** 须 `BIO=1` + `ALLOW_PRODUCTION`。
 */

function parseEnvBool(raw: string | undefined): boolean {
  if (raw == null || raw.trim() === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** 显式三态：`null` = 未配置，走各能力的默认策略 */
function parseTruthyEnv(raw: string | undefined): boolean | null {
  if (raw == null || raw.trim() === "") return null;
  const v = raw.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  return false;
}

/**
 * 赞过列表（`GET /api/v1/community/me/likes`、个人中心分段 Tab + 弹层 + 独立页 `/community/me/likes`）。
 * 关闭时个人中心亦**不拉取** `GET …/me/likes-received`，统计条**不展示「帖子获赞」**（与 `deriveCommunitySocialStatsDataState` 一致），避免「有数无入口」的 IA 断裂；主站会 strip `?tab=likes` 并提示配置横幅。
 * **默认开启**（后端已接 PG）；仅当显式设置 `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST=0`/`false`/`off` 等时关闭。
 */
export function isCommunityMeLikesListEnabled(): boolean {
  const explicit = parseTruthyEnv(process.env.NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST);
  if (explicit !== null) return explicit;
  return true;
}

/**
 * 头像本地上传 / data URL（编辑资料内；仍走 `PUT /api/v1/me` 的 `avatar_url`）。
 * - **production** 且未设置 env → `false`
 * - 非 production 且未设置 → `true`（本地默认可传）
 * - 显式 `0`/`false`/… → `false`
 */
export function isCommunityMeAvatarUploadEnabled(): boolean {
  const explicit = parseTruthyEnv(process.env.NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD);
  if (explicit !== null) return explicit;
  return process.env.NODE_ENV !== "production";
}

/**
 * 独立个人简介（bio）预览与编辑。
 * - **非 production · env 未设**：默认 **开启**（与头像上传 dev 默认可用对齐 · ① 本地满分闸）。
 * - **非 production · 显式 `0`**：关闭。
 * - **production**：须 `NEXT_PUBLIC_COMMUNITY_ME_BIO=1` 且 `NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION=1`。
 */
export function isCommunityMeBioEnabled(): boolean {
  const explicit = parseTruthyEnv(process.env.NEXT_PUBLIC_COMMUNITY_ME_BIO);
  if (explicit === false) return false;
  const enabled = explicit === true || (explicit === null && process.env.NODE_ENV !== "production");
  if (!enabled) return false;
  if (process.env.NODE_ENV === "production") {
    return parseEnvBool(process.env.NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION);
  }
  return true;
}
