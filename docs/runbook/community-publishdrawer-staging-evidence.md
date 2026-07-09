# PublishDrawer · ② Staging 浏览器视频证据

本 runbook 与 **`scripts/evidence/run-community-publishdrawer-staging-evidence.sh`**、**`frontend/e2e/community-publishdrawer-staging-evidence.spec.ts`** 同源。

## 阶次与结论边界

| 阶次 | 含义 |
|------|------|
| **① 本地** | MinIO / `scripts/evidence/run-community-publishdrawer-browser-evidence.sh`（**不得**替代 staging）。 |
| **② Staging** | 本脚本 + 本 runbook；**仅**可写 **staging 已验**。 |
| **③ Production** | **不在**本流程内宣称；artifact 中明确写 **未验证**。 |

## 执行场所与结论纪律（必读）

- **禁止**在无完整 **`STAGING_*`**（含 **`STAGING_ALLOW_HAR` 显式 0/1**）注入的 Agent 沙箱、或任何**未配置真实 staging URL / API / 账号 / 密码**的环境中**反复**执行本脚本充当「验收」；缺变量时脚本会立即退出且**不会**创建 **`evidence/community-media-staging-chain/<timestamp>/`**。
- **必须**在维护者**本机终端**（已 `export` 或等价私密 env）或**私密 CI**（仓库 Secrets / 受控 runner）中执行 **`scripts/evidence/run-community-publishdrawer-staging-evidence.sh`**。
- **② staging 已通过**：**仅当**上述脚本 **`exit 0`**，且对应时间戳目录下存在 Playwright **真实**产物（至少含 **`browser-evidence-summary.md`** 及 spec 约定的日志/截图等）时方可表述。**不得**在无真实跑通输出时手造、补写该目录或宣称 staging 已验。

## 前置

- Staging **Next** 与 **API** 已部署且可从运行机访问。
- 测试账号：**`STAGING_TEST_USER` + `STAGING_TEST_PASSWORD`** 在 staging 上可 **`POST /auth/login`**（或先设 **`STAGING_SEED_BEFORE_LOGIN=1`** 且 staging 仍暴露 **`POST /auth/seed-test-accounts`** —— 仅当组织允许）。
- `setup-meta-chain` 仍会跑：若 staging **`/meta`** 与链元断言不一致，可设 **`STAGING_RELAX_META_CHAIN_GUARD=1`**（脚本会透传到 **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD`**）。

## 必填环境变量

| 变量 | 说明 |
|------|------|
| **`STAGING_PLAYWRIGHT_BASE_URL`** | Staging Next 根 URL（无尾 `/` 亦可）。 |
| **`STAGING_API_BASE_URL`** | Staging API 根 URL（**禁止** `127.0.0.1`、**:19000**、MinIO 形态）。 |
| **`STAGING_TEST_USER`** | 登录邮箱；**禁止** `tourist@test.com`。 |
| **`STAGING_TEST_PASSWORD`** | 登录密码。 |
| **`STAGING_ALLOW_HAR`** | **`0`** 或 **`1`**（须显式；**不得**省略）。 |

## 可选环境变量

| 变量 | 说明 |
|------|------|
| **`STAGING_API_HEALTH_URL`** | 覆盖默认 **`${STAGING_API_BASE_URL}/health`**。 |
| **`STAGING_SEED_BEFORE_LOGIN`** | 设为 **`1`** 时先 **`POST /auth/seed-test-accounts`**（staging 须仍允许该端点）。 |
| **`STAGING_GATEWAY_LOG_REFERENCE`** | 当 **`STAGING_ALLOW_HAR=0`** 时，写入 summary 的人类可读引用（工单号、CDN/WAF 查询、网关日志链接等）。 |
| **`STAGING_EVIDENCE_TS`** | 输出子目录名；默认 UTC **`YYYYMMDDThhmmssZ`**。 |
| **`STAGING_RELAX_META_CHAIN_GUARD`** | 透传为 **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD`**（例：`1`）。 |

## 输出目录

- 根下：**`evidence/community-media-staging-chain/<timestamp>/`**
- 与 ① **`evidence/community-media-local-minio-chain/out/`** 严格分离。
- 内含与 ① 同形 artifact：`browser-capabilities-from-page.json`、`browser-multipart-chain.log`、`browser-network-api.log`、`browser-create-post-response.json`、`browser-console.log`、`browser-publishdrawer-*.png`、`browser-evidence-summary.md`；若允许 HAR 则另有 **`browser.har`**。

## 运行示例

```bash
export STAGING_PLAYWRIGHT_BASE_URL="https://staging.example.com"
export STAGING_API_BASE_URL="https://api-staging.example.com"
export STAGING_TEST_USER="you+staging-publish@example.com"
export STAGING_TEST_PASSWORD="***"
export STAGING_ALLOW_HAR=0
export STAGING_GATEWAY_LOG_REFERENCE="Datadog view ABC-123 (link internal)"

bash scripts/evidence/run-community-publishdrawer-staging-evidence.sh
```

若 staging **允许** Playwright 落盘 HAR：

```bash
export STAGING_ALLOW_HAR=1
bash scripts/evidence/run-community-publishdrawer-staging-evidence.sh
```

## HAR 策略

- **`STAGING_ALLOW_HAR=1`**：脚本在收尾 **`test -s …/browser.har`**；Playwright 使用 **`PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_RECORD_HAR_PATH`**（见 **`frontend/playwright.config.ts`** 根 **`use.contextOptions.recordHar`**）。
- **`STAGING_ALLOW_HAR=0`**：不录 HAR；**`browser-network-api.log`** + **`browser-multipart-chain.log`** 为机读主链；**`browser-evidence-summary.md`** 写明未录 HAR，并鼓励填写 **`STAGING_GATEWAY_LOG_REFERENCE`**。

## 与 ① 的验证等价性

与本地 MinIO 证据用例对齐的检查项：

- **`GET …/community/media/capabilities`**：**200**，**`public_video_publish_ready=true`**，**`max_video_seconds=180`**
- **multipart**：session → parts → **PUT** part → complete → **create post** **200**
- **Feed UI**：新帖正文可见；**`<video>` canplay**；**`src` 非空**

## 安全与合规

- **勿**将含 Cookie/Authorization 的 **`browser.har`** 提交到公开仓库；默认输出路径建议 **`.gitignore`** 或仅存内网制品库。
- 本流程**不扩产品功能**；仅证据与文档。

## 相关

- ① 本地：**`scripts/evidence/run-community-publishdrawer-browser-evidence.sh`**
- Playwright：**`--project=chromium-staging-publishdrawer`**（**无** `setup-meta-chain`）；HAR 路径键见 **`frontend/playwright.config.ts`**（**`PLAYWRIGHT_COMMUNITY_STAGING_PUBLISHDRAWER_RECORD_HAR_PATH`** 优先于 ① 的 **`PLAYWRIGHT_COMMUNITY_PUBLISHDRAWER_RECORD_HAR_PATH`**）。
