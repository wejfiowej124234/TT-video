# ① 本地 release-ready vs ② 测试网验收（口径一页）

**Version:** 1.0.1  
**Status:** `Target`（工程纪律；**不**替代 **04 / 93 / 14** 契约正文）

## 三阶顺序（禁止跳阶）

| 阶次 | 含义 |
|------|------|
| **① 本地** | 可复现命令、同一二进制、门禁与留证；**不以** PR/远端 CI 为唯一收口。 |
| **② 测试网** | 真实 **Next/API/S3/CDN/CORS/PSP** 等依赖下验收；须**单独举证**。 |
| **③ 生产** | **[go-live-checklist](../go-live-checklist.md#go-decision-entry-point)** 与组织流程；**①② 绿不自动等于 GO**。 |

## ① 本地现在就能收口（release-ready 硬杠）

- **最小三连**：[TT-LOCAL](TT-LOCAL-CI-DELIVERY-GATE-001.md) · `bash scripts/gates/ci-local-delivery-minimum.sh`
- **企业预检**：`bash scripts/enterprise-preflight.sh`
- **前端扩充**：`bash scripts/gates/local-delivery-expanded.sh`（含 lint/tsc/Vitest；**`DATABASE_URL`** 齐备时再跑 Playwright 尾段，否则尾段 SKIP 仍 **exit 0** — 见 TT-LOCAL §2.2）
- **防假完成边界**：[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-intro) — **机读绿 ≠ 93 / 96-20 全文 / 96-15 Tier C**
- **社区媒体可观测（可选 · ①）**：根 `.env` 设 **`TT_COMMUNITY_MULTIPART_LOG=1`** 后，API 进程 **stderr** 写 **`tt_community_multipart_chain=release_multipart_chain_v1`** 行（**`x-request-id`** 对拍）：**`GET /health`**（**`phase=health_community_public_video_spec`**）、**`GET …/media/capabilities`**（**`capabilities_snapshot`**，与 JSON **`public_video_spec_required`/`head_bucket_probe_impl`/`head_bucket_cache_hit`** 同源）、**multipart 三 POST**、**`GET …/media-assets/:id` 成功**（**`asset_status_snapshot`**）、**429 上传限流**（**`rate_limit_exceeded`**）。**②** 仍以浏览器 **PUT**、桶 **CORS**、**CDN** 举证 — 见 [COMMUNITY-MEDIA-OBJECT-STORAGE](COMMUNITY-MEDIA-OBJECT-STORAGE.md) · **04 §三** **`GET …/media/capabilities`** 行

## ② 必须到测试网才能证（本地不可替代）

- **浏览器直传 PUT**、桶 **CORS**、**CDN/WAF**、公网 **playback** 与 Feed **canplay** 等
- **Staging 浏览器证据链**（须 **`STAGING_*`**）：[community-publishdrawer-staging-evidence](community-publishdrawer-staging-evidence.md) · `scripts/evidence/run-community-publishdrawer-staging-evidence.sh`
- **PSP / webhook / 真资金或准生产支付形态**

## 相关

- [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)
- [solo-dev-rhythm §6.5](../solo-dev-rhythm.md)（扩充闸读法）
- [TT-GATE · 社区深度缺口登记](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-31-community)（**① 机读绿 ≠ 31/93/96-20 全文**）

## 变更记录（本篇）

| Version | 摘要 |
|---------|------|
| **1.0.1** | 社区媒体：**stderr** **`phase`** 清单与 **capabilities JSON** 对拍、互指 **04**/**TT-GATE**。**承** **v1.0.0**。 |
| **1.0.0** | 初版：① 本地 release-ready vs ② 测试网口径。 |
