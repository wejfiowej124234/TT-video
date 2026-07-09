# G3 Production CDN · Official Asset Baseline V1

**Machine SSOT:** [`registry/g3-production-cdn-official-assets.v1.json`](../../registry/g3-production-cdn-official-assets.v1.json)  
**Prep registry:** [`registry/production-release-prep.v1.yaml`](../../registry/production-release-prep.v1.yaml)  
**Parent:** [`G3-01-PRODUCTION-NETWORK.md`](G3-01-PRODUCTION-NETWORK.md)

---

## 阶段口径

| 项 | 状态 |
|----|------|
| ② Staging 资产交付 | **VERIFIED** · `TT_OCS_OFFICIAL_ASSET_BASELINE_V1` |
| ③ G3 Production CDN **Prep** | **READY** · `TT_G3_PRODUCTION_CDN_PREP` |
| ③ G3 Production CDN **Verified** | **PLANNED** · `TT_G3_PRODUCTION_CDN_VERIFIED` |
| Production GO | **NO_GO** |

**诚实边界：** Staging 上媒体**存在且可解码** ≠ **Production CDN 全球边缘已验**。Prep READY = 配置工件 + 脚本 + 校验器齐备；**发布等一下**，Owner 切线后再验 CDN。

---

## CDN 策略（V1 · 写死）

| 维度 | 值 |
|------|-----|
| 公网前缀 | `https://cdn.traveltrust.app` |
| 官方资产路径 | `official-cold-start/v1/ocs-{chain}-{slot}.jpg` |
| 全球缓存 | Cloudflare Anycast edge |
| Cache-Control | `public, max-age=31536000, immutable` |
| 版本管理 | V1 → V1.1 → V2 **新 prefix**，禁止原地改 READY |
| 对象生命周期 | R2 ·  superseded prefix 90d → STANDARD_IA · **禁止** governance 外硬删 |

社区用户上传前缀（并行）：`community-media/v1/` · `max-age=86400, immutable`

---

## Prep 工件（已生成）

| 文件 | 内容 |
|------|------|
| `cloudflare-cache-rules.v1.json` | 边缘缓存规则 |
| `r2-lifecycle-policy.v1.json` | 对象生命周期 |
| `ocs-r2-upload-manifest.v1.json` | 60 对象 R2 key + CDN URL |
| `production-cdn-url-map.v1.json` | Staging API path → Production CDN URL |
| `g3-cdn-prep-checklist.v1.json` | Owner 切线步骤 |

Evidence 根：`evidence/GO_production_readiness/G3-01/preparation/`

---

## 执行

```bash
# 一键 Phase ①② prep + Phase ③ 切线准备（非 GO）
bash scripts/dev/run-phase12-production-release-prep.sh

# 或分步
bash scripts/dev/run-g3-production-cdn-prep.sh
bash scripts/dev/run-production-go-prep.sh
```

Owner **切线时**（非 prep）：

```bash
cp scripts/dev/production-media-r2-cdn.env.example scripts/dev/.env.production-media-r2.local
PRODUCTION_CDN_DRY_RUN=0 bash scripts/dev/configure-production-media-r2-cdn.sh
node scripts/dev/bootstrap-ocs-official-assets-to-r2.cjs --apply
bash scripts/dev/run-reality-verification.sh --gate G3 --domain G3-01
```

---

## Bootstrap 模式

| 环境 | 模式 |
|------|------|
| ② Staging | Docker COPY + HTTP probe（**不依赖** Fly SSH · Windows 安全） |
| ③ Production | R2 upload + CDN DNS · **须** production probes 后 `TT_G3_PRODUCTION_CDN_VERIFIED` |

---

## 禁止宣称

- Staging `TT_OCS_OFFICIAL_ASSET_BASELINE_V1: VERIFIED` → **不得** 冒充 G3 CDN VERIFIED  
- Prep READY → **不得** 冒充 Production GO
