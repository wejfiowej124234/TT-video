# TT-C4-MEDIA-TUNNEL-UNAVAILABLE · 社区媒体 Tunnel 不可用

**Issue ID：** `C4-MEDIA-TUNNEL-UNAVAILABLE`（incident 已关闭 · **Staging 真源已 superseded**）  
**企业 SSOT：** [`TT-MEDIA-THREE-TIER-ARCHITECTURE.md`](TT-MEDIA-THREE-TIER-ARCHITECTURE.md) · [`registry/media-three-tier-architecture.v1.yaml`](../../registry/media-three-tier-architecture.v1.yaml)

> **Staging / Production 禁止 localtunnel。** 短期 tunnel 解阻仅作 incident；长期须 **Fly → Cloudflare R2 → `cdn.traveltrust.app`**。配置：`scripts/dev/configure-staging-media-r2-cdn.sh`  
**Evidence：** `evidence/GO_staging_infra_console_errors/20260703T130900Z/c4-media-tunnel-unavailable.json`  
**分类：** Production Infrastructure（**非** Market Runtime · **非** OCS / DDG / SOPCP）

```text
Market Default Filter Audit: CLOSED (不重开)
OCS · DDG · SOPCP: CLOSED (Evidence Reused)
```

---

## 症状

浏览器 Console 大量：

```text
GET https://*.loca.lt/traveltrust-community-media/.../*.mp4 → 503
x-localtunnel-status: Tunnel Unavailable
```

列表 API（`acquisition/listings`）与 **默认筛选** 无关；仅 **社区/市场卡片视频 URL** 无法加载。

---

## 根因

测试网 Fly secrets 将 `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` 指向 **localtunnel → 本机 MinIO `:19000`**（② 临时解阻，见 [`TT-PHASE2-C4-STAGING-EVIDENCE.md`](TT-PHASE2-C4-STAGING-EVIDENCE.md)）。

Tunnel 进程停止或 MinIO 未运行 → 公网前缀 **503**。

---

## 短期恢复（运维）

1. 本机启动 MinIO（`:19000`）与桶 `traveltrust-community-media`
2. 启动 localtunnel，获得**新** `https://<subdomain>.loca.lt`
3. 更新 Fly app `tt-api-staging` secrets：
   - `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`
   - `COMMUNITY_MEDIA_S3_ENDPOINT` / `AWS_*`（与 C4 文档一致）
4. `fly apps restart tt-api-staging`
5. 验证：`curl -sI "${PUBLIC_BASE_URL}/"` 非 503

---

## 长期（PI3）

迁移至 **R2 / S3 / CDN** 持久前缀；**禁止** 用 `*.loca.lt` 宣称 Phase ② GO 或 Production GO（见 [`TT-PHASE2-STAGING-READINESS-REPORT.md`](TT-PHASE2-STAGING-READINESS-REPORT.md)）。

---

## 关闭条件

- [x] staging 媒体公网前缀 tunnel health **200**（20260703T133800Z · `sixty-foxes-grin.loca.lt`）
- [x] Fly secrets 已 `fly secrets deploy` · `tt-api-staging` 已 rolling restart
- [x] Evidence 复测 minio health **200**
- [x] 总账 `status: CLOSED` + `closed_utc`
- [ ] **长期**：迁移 R2/S3/CDN（PI3 · 非 blocking）
