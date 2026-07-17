# PSG P0④ · COS Governance（持久对象存储永久治理）

**STATUS:** `DESTRUCTIVE_CERT_PASS`  
**Production GO:** `NO_GO` · **PF Step 5:** `FROZEN` · **Deploy integrate:** **DEFERRED** until P0③④⑤ exit  
**Machine key:** `TT_PSG_P0_4_COS_GOVERNANCE`  
**Registry:** [registry/psg-p0-4-cos-permanent.v1.yaml](../../registry/psg-p0-4-cos-permanent.v1.yaml)  
**Parent:** [TT-PUBLIC-SURFACE-GOVERNANCE.md](./TT-PUBLIC-SURFACE-GOVERNANCE.md)

---

## 0 · 一句话

公开媒体真源 = **持久对象存储**（Staging：Fly Tigris via `COMMUNITY_MEDIA_S3_*`）。  
**禁止** CMS/OCS 将发布资产写入 Fly ephemeral `data/community_post_media/`。  
**sftp / restore-staging-ephemeral-media = LEGACY_INCIDENT_ONLY** — **不得**用作 P0④ 关闭路径。  
任一步血缘断裂 → **COS FAIL** → **禁止 Deploy 进入下一步**。

---

## 1 · 状态机（写死 · 禁止跳）

| 状态 | 含义 | 可宣称 CLOSED？ |
|------|------|----------------|
| `FOUNDATION_READY` | 血缘文档 + 弱 Gate | 否 |
| `GOVERNANCE_ENFORCED` | 契约 + Gate + API 禁 ephemeral 发布 | 否 |
| `OBJECTS_MIGRATED` | 全量公开对象已落桶且绑定 asset_id | 否 |
| `DESTRUCTIVE_CERT_PASS` | clean redeploy / machine replacement 后 broken=0 | 否（证据齐） |
| `CLOSED` | 上表全满足 | **是**（仍 ≠ PF 解冻 ≠ Production GO） |

**Bake**（`data/official-cold-start/media/`）= 灾备种子 only · **禁止**冒充主存或 Deploy PASS。

---

## 2 · 血缘（写死）

```text
CMS/OCS Entity
      │
      ▼
catalog_media_assets.id     (Asset Registry · 禁止裸 URL 作唯一绑定)
      │
      ▼
storage_backend + bucket + object_key + checksum_sha256
      │
      ▼
PUBLIC_BASE_URL / object_key   (Tigris / R2 CDN)
      │
      ▼
Guest surface
```

**禁止（publish 态）：**

- 无 `asset_id` 的裸 URL 绑定
- `url` 以 `/api/v1/uploads/community-posts/` 为生产真源（① 显式 `TRAVELTRUST_ALLOW_EPHEMERAL_CATALOG_MEDIA=1` 除外）
- 对象未 HEAD 成功即 `publish`
- `storage_backend=bake_dr` 作为主存
- 引用计数 > 0 时硬删对象

---

## 3 · Gate 检查（全表面）

| 检查 | FAIL |
|------|------|
| Object 存在 | HEAD/Range 非 2xx/206 |
| MIME | 缺失或 HTML/JSON 冒充媒体 |
| Content-Length | 缺失或 0（正式图） |
| Checksum | 声明 sha256 与对象不一致（有则验） |
| Lifecycle | Guest 见 draft/in_review/archived/non-production |
| Asset ID | 正式 catalog/listing 缺 asset_id |
| Ephemeral URL | published 指向 uploads/community-posts |
| Orphan | published 无引用 / 引用无对象 |
| Refcount | archive 硬删前 ref>0 |

机读：`TT_PSG_P0_4_COS_INTEGRITY: PASS|FAIL`  
目标公开媒体探测数：**≥89**（或 registry `min_public_media_probe`）。

```bash
node scripts/gates/check-psg-cos-reference-integrity.cjs
STAGING_API_BASE=https://tt-api-staging.fly.dev node scripts/gates/check-psg-cos-reference-integrity.cjs
```

Deploy / 机器轮转后：**必须**重跑本 Gate（`run-psg-runtime-certification.sh` Step 6）。

---

## 4 · CLOSED 唯一入口（破坏性验证）

1. PutObject 全量 + URL/asset_id 回绑 → Gate PASS（pre）  
2. Owner clean redeploy / restart `tt-api-staging`（**不清桶**；**禁止**先 sftp restore）  
3. 立即重跑 COS Gate + Matrix  
4. `broken=0` · `orphan=0` · `bare_url=0` · `ephemeral_published=0` · `non_production_leak=0`  
5. 证据：`evidence/GO_psg_foundation/cos_permanent/P0-4-DESTRUCTIVE-CERT-LATEST.json`

未跑第 2–5 步 → **最多** `OBJECTS_MIGRATED` · **禁止** `CLOSED`。

```bash
# Owner-gated
PSG_ALLOW_DESTRUCTIVE_REDEPLOY=1 STAGING_API_BASE=https://tt-api-staging.fly.dev \
  node scripts/dev/run-psg-p0-4-destructive-media-cert.cjs
```

---

## 5 · 拓扑

- **Staging 主存：** Tigris（`COMMUNITY_MEDIA_S3_*`）  
- **Key 前缀：** `official-cold-start/v1/{filename}`（CMS/OCS 静态）· `community-media/v1/`（用户视频）  
- **R2 / cdn.traveltrust.app：** PI3-MEDIA-R2-CDN-FINAL · **不挡**本 P0④ CLOSED  

---

## 6 · 诚实边界

① 本地 MinIO/ephemeral 仍可用于开发。  
② Staging P0④ CLOSED ≠ PF Step 5 解冻 ≠ Staging Batch PASS ≠ Production GO。  
③ sftp 补图 ≠ 持久治理。
