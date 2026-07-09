# Phase ①② 发布前准备 · Phase ③ 切线准备

**Machine SSOT:** [`registry/production-release-prep.v1.yaml`](../../registry/production-release-prep.v1.yaml)  
**CDN 专册:** [`TT-G3-PRODUCTION-CDN-OFFICIAL-ASSETS.md`](TT-G3-PRODUCTION-CDN-OFFICIAL-ASSETS.md)  
**Production GO:** [`TT-PRODUCTION-GO-DECISION-PACKAGE.md`](TT-PRODUCTION-GO-DECISION-PACKAGE.md)

---

## 阶段口径：① → ② → ③

| 阶段 | 范围 | 状态 |
|------|------|------|
| **① 本地** | 单元测试 · 绿集 · MinIO | COMPLETE |
| **② Staging** | OCS · Asset · Feed · DDG | COMPLETE（独立 evidence） |
| **③ Prep** | G3 CDN 工件 · GO 入口清单 | **READY** |
| **③ Cutover** | DNS · R2 · Production probes | **DEFERRED**（发布等一下） |
| **Production GO** | Decision Package 签字 | **NO_GO** |

---

## 企业化链路（已闭合到 ②）

```text
SSOT
  ↓
Official Catalog
  ↓
Official Asset
  ↓
Feed · Guide · Provider · Community · Campaign · Acquisition
```

历史遗留 Unsplash / 占位图 → **OCS 官方化**（Staging 已验 60/60）。

---

## 机读键一览

| 键 | 值 | 含义 |
|----|-----|------|
| `TT_OCS_OFFICIAL_ASSET_BASELINE_V1` | VERIFIED | ② Staging 资产 |
| `TT_G3_PRODUCTION_CDN_PREP` | READY | ③ CDN 配置/生命周期/脚本齐备 |
| `TT_G3_PRODUCTION_CDN_VERIFIED` | PLANNED | 须 Production CDN 探针 |
| `TT_PRODUCTION_GO_PREP` | READY | GO Decision 入口清单 |
| `TT_PRODUCTION_GO` | NO_GO | 未签字 · 未 G3 六域 VERIFIED |
| `TT_PRODUCTION_RELEASE_PREP` | READY | 本轨 prep 完成 |

---

## 一键执行

```bash
bash scripts/dev/run-phase12-production-release-prep.sh
```

Evidence：`evidence/GO_production_readiness/phase12-release-prep/<UTC>/`

---

## 诚实边界

- **Prep READY ≠ Production GO**  
- **Staging VERIFIED ≠ G3 CDN VERIFIED**  
- Windows Fly SSH 失败 = **工程实现** · 非产品风险（Evidence：Docker COPY + HTTP probe）
