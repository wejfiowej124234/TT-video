# Staging ↔ Release Candidate · SSOT Alignment Cleanup

**Machine SSOT:** [`registry/staging-rc-ssot-alignment.v1.yaml`](../../registry/staging-rc-ssot-alignment.v1.yaml)  
**OCS SSOT:** [`data/official-cold-start/dataset.v1.json`](../../data/official-cold-start/dataset.v1.json)  
**RC signoff:** [`evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md`](../../evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md)

---

## 阶段口径

| 项 | 含义 |
|----|------|
| **② Staging ALIGNED** | 运行态 = OCS SSOT + RC 边界 · `TT_STAGING_RC_SSOT_PARITY: ALIGNED` |
| **Production GO** | **NO_GO** — 本轨不触发布 |
| **G3 CDN VERIFIED** | **PLANNED** — 不在本轨 |

**禁止新增业务功能。** 仅：历史数据 · 旧展示 · 卷内媒体 · 进程缓存残留清理。

---

## 清理范围

| 层 | 动作 |
|----|------|
| **历史烟测帖** | c3/c10/c12/c4/c5 corridor · Admin unpublish + SQL draft |
| **非 OCS 公开展示** | Guides / Community / Market 队列 · 仅保留 OCS state 映射 |
| **旧 API 卷内媒体** | Dockerfile COPY 640×480 OCS 资产 · 废弃 404 UUID PNG |
| **缓存** | Fly restart tt-api-staging + tt-web-staging |
| **RC 对拍** | Feed=10 · Guides=10 · 无 smoke body · 媒体 HEAD 200 |

---

## 执行

```bash
# 完整清理 + deploy + 验收（Owner 授权 Staging 写入）
bash scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh

# 仅计划/Admin+SQL（不 deploy）
DRY_RUN=1 bash scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh

# 清理但不 fly deploy（本地已推镜像时）
SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh
```

**Evidence：** `evidence/GO_staging_rc_ssot_alignment/<UTC>/`

**机读键：** `TT_STAGING_RC_SSOT_PARITY: ALIGNED` · **`TT_STAGING_RC_BASELINE: READY`**（见 [`TT-STAGING-RC-BASELINE-ENFORCEMENT.md`](TT-STAGING-RC-BASELINE-ENFORCEMENT.md)）

---

## RC 基线 enforcement（写死）

Staging **唯一运行基线** = `TT_STAGING_RC_BASELINE`。Deploy 前硬闸 · 禁止 Smoke/非 OCS/旧卷媒体。

```bash
bash scripts/dev/run-staging-rc-baseline-enforcement-check.sh   # 只读
bash scripts/dev/run-staging-rc-baseline-final-alignment.sh   # 写 ACTIVE.json
```

**Registry：** [`registry/staging-rc-baseline.v1.yaml`](../../registry/staging-rc-baseline.v1.yaml)

---

## SSOT 单一真源链

```text
RELEASE-CANDIDATE-SIGNOFF
        ↓
official-cold-start/dataset.v1.json
        ↓
assets.v1.json + media/
        ↓
OCS state.json (10 community_posts)
        ↓
Staging Feed / Guides / Public Ops
```

---

## 诚实边界

- **ALIGNED ≠ Production GO ≠ 发布**
- OCS 640×480 占位图 = 可解码交付 · **非** 最终摄影素材
- Windows Fly SSH **不依赖** — 媒体走 Docker COPY + HTTP probe
