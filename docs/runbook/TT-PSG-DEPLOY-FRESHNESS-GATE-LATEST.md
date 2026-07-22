# TT · PSG · Deploy Freshness Gate（LATEST）

**阶段：** ② Staging 任何部署前/后 · **≠** ③ Production GO · **≠** 变更 PSG Archive  
**Machine key：** `TT_DEPLOY_FRESHNESS_GATE: ENFORCED`  
**Registry：** [`registry/deploy-freshness-gate.v1.yaml`](../../registry/deploy-freshness-gate.v1.yaml)  
**双轨 / Identity：** [TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST](./TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md) · `TT_DEPLOYMENT_IDENTITY_GATE`（pre-deploy **先跑**）

---

## 0 · 写死规则（Owner 要求）

> **任何部署**（更新 Web、API、Web3 配套镜像/密钥、或顺手 redeploy）  
> **都必须先声明** `DEPLOY_TARGET`（Identity Gate），再检查：即将上线的 **代码 + 公开展示数据 + ACTIVE 地址基线** 是否仍是当前真源。  
> **禁止**「只更 Web3 / 只更一处」却把 **旧代码、旧 Unsplash、旧非 OCS 挂牌** 带回来。  
> **禁止**混用：Certification Freeze tip + Staging ops dirty 补丁当同一部署身份。

| 部署目标 | 必须过 Freshness |
|----------|------------------|
| `deploy-tt-web-staging.sh` | ✅ pre + post（经 RC Baseline gate） |
| `phase2-staging-fly-deploy-and-sync.sh` | ✅ pre（经 RC Baseline gate） |
| 其它 source `staging-rc-baseline-gate.sh` 的脚本 | ✅ |
| 纯链上 forge broadcast（不触 Fly 镜像） | 矩阵闸另管；**若随后部署 API/Web 仍须本闸** |

---

## 1 · 检查项

| # | 检查 | 失败含义 |
|---|------|----------|
| 1 | Public Display **10×4**（向导/商家/收购/社区） | 旧展示数据仍在公开展示面 |
| 2 | `active_deploy_baseline = v311_fund_safety_candidate_v2` | Web3 地址权威被旧 LEGACY / FG-15-A 顶替 |
| 3 | Staging Catalog bake `=1`（Web 目标） | Ambient 会静默回 Unsplash |
| 4 | Git tip 记录（STRICT 可选） | 误用脏树/旧 tip 部署 |
| 5 | DDG 默认禁止 showcase re-seed | 脚本又把 Unsplash 挂牌种回来 |
| 6 | Web tip attestation 强制 + 默认 no-cache + post `release-identity` | 旧包/旧 SHA 静默上线 |
| 7 | 部署后 10×4 再验 | 部署把公开展示冲乱却当绿 |

---

## 2 · 命令

```bash
# Identity（必填目标）+ Freshness
export DEPLOY_TARGET=STAGING_PATCH
export TT_STAGING_PATCH_IDS=PATCH-STG-001,PATCH-STG-005
python scripts/dev/run-deployment-identity-gate.py --mode pre-deploy
python scripts/dev/run-deploy-freshness-gate.py --mode pre-deploy --target all

# 部署脚本已自动挂（staging-rc-baseline-gate → identity + freshness）
bash scripts/dev/deploy-tt-web-staging.sh
bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh
```

展示漂移时先锁 10×4，再部署：

```bash
STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh
python scripts/dev/check-public-display-10x4-counts.py   # LOCKED_10X4
```

**Owner 覆盖（罕见）：** `TRAVELTRUST_DEPLOY_FRESHNESS_OVERRIDE=1`  
**对齐窗跳过 10×4 pre：** `STAGING_RC_BASELINE_ALIGNING=1`

---

## 3 · 与 10×4 / CMS 防乱关系

| 文档 | 角色 |
|------|------|
| [TT-PSG-PUBLIC-DISPLAY-10X4-LOCK](./TT-PSG-PUBLIC-DISPLAY-10X4-LOCK-LATEST.md) | 展示面只许 10×4 |
| [TT-CMS-COS-ANTI-CHAOS](./TT-CMS-COS-ANTI-CHAOS-PERSISTENCE-LATEST.md) | COS 持久 ≠ FE 不回退 |
| **本闸** | **每次部署**强制复核，防旧码旧数据回流 |

诚实边界：本闸 PASS ≠ Production GO ≠ 各国 CMS Content QA CLOSED。
