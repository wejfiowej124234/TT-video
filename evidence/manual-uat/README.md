# TravelTrust Manual UAT · Quality Evidence SSOT

**Status:** FROZEN · **2026-06-30** · **只追加 · 不迁目录 · 不删 Bug**

> **文档 = 证据，不是成果。** 每份文件须回答：**它证明了什么？**

| 证据 | 证明 |
|------|------|
| `SESSION-LOG.md` | 本轮在什么环境、commit、谁测、覆盖范围 |
| `UI-CHECKLIST.md` + Requirement ID | 哪条需求被手测覆盖 |
| `defects/DEFECT-NNN.md` | 问题真实存在 · 如何修 · 如何验关闭 |
| `SUMMARY.json` | 本轮结果可统计、可机读 |
| `release/R00N-*.md` | 某版本/闸门发布了什么 Session、关了哪些 Defect、含哪些 commit |
| `dashboard/PHASE3-READINESS.md` | **自动生成** — 当前是否接近下一阶段质量门槛 |

**面向：** Production Gate · Mainnet · v1.1/v2.0 迭代 · 合作方/审计工程成熟度展示。

## 目录树（冻结 · 勿改顶层）

```
evidence/manual-uat/
├── sessions/<timestamp>/       # 只 **新增** Session，不迁移旧目录
├── defects/                    # DEFECT-NNN 永久档案（永不删除）
├── regression/                 # REG-NNN 回归队列
├── release/                    # R00N 发布/闸门证据
├── screenshots/
├── summary/                    # MASTER-DEFECT-REGISTER · REQUIREMENT-TRACEABILITY
├── signoff/
└── dashboard/                  # PHASE3-READINESS.md（脚本生成）
```

## 证据链（闭环）

```
Requirement (R-Cx-NNN)
    ↓
Manual Case (UI-CHECKLIST)
    ↓
Defect (DEFECT-NNN)
    ↓
Regression (REG-NNN)
    ↓
Closed → Release (R00N)
```

## 缺陷生命周期

`OPEN` → `FIXED` → `READY_FOR_RETEST` → `VERIFIED` → `CLOSED` · 可 `REOPENED`

字段：**Status** · **Fix Commit** · **Regression Session** · **Requirement**（可选）

## Severity SLA

| Severity | 目标 |
|----------|------|
| P0 | 当天关闭 |
| P1 | 24 小时 |
| P2 | 下一 Session |
| P3 | 版本内（Release） |

Dashboard 自动统计 **Overdue P1 / P2**。

## 日常操作

1. **新 Session：** 复制 `sessions/_TEMPLATE/` → `sessions/<UTCstamp>/`（或 Agent 建目录）
2. **手测：** 更新 `UI-CHECKLIST.md` · 缺陷 → `defects/DEFECT-NNN.md` + MASTER 追加行
3. **修 Bug：** 更新 Status / Fix Commit → `regression/REG-NNN.md`
4. **轮末：** 填 `SUMMARY.json` · `signoff/` · 跑 `python scripts/dev/generate-manual-uat-dashboard.py`
5. **发布/闸门：** 新建 `release/R00N-*.md` · 汇总 Session + Defect + Commit + Signoff

## 清单 SSOT（走廊定义 · 不变）

- [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](../../docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md)
- [TT-LOCAL-P0-MANUAL-UAT-CHECKLIST](../../docs/runbook/TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md)
- [TT-LOCAL-TEST-ACCOUNTS-MATRIX](../../docs/runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md)

**latest:** `sessions/latest` · **禁止**再迁 `evidence/local-manual-uat-session/`。

## 项目主线（ACTIVE · 验产品 · 2026-06-30）

```
Manual UAT → Business Defect → Regression → Production Entry Review → Testnet Sign-off → Mainnet Preparation
```

SSOT: [TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md](../../docs/runbook/TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md)

**已结束：** Configuration → Governance → Convergence（日常主线）

## Production Entry Review 工作流（Active）

```
Manual UAT → Business Defect → Regression → Production Entry Review
```

**Dashboard 主视图：** Open P0/P1/P2 · Manual Coverage · Regression · Production Readiness — 见 `dashboard/PHASE3-READINESS.md`。

- **PER Regression (ACTIVE):** [TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md](../../docs/runbook/TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md) · signoff `signoff/PER-REGRESSION-20260630.md`

## Configuration（已毕业 · FROZEN · 2026-06-30）

**`TT_CONFIGURATION_ZERO_DRIFT: FROZEN`** — No further work unless new configuration is introduced.

- CFG 封顶 **CFG-001～CFG-028** · **Configuration Sprint 永久关闭**
- **配置问题复发** → **Regression**（`DEFECT-NNN` + `REG-NNN`）· **禁止**重开 CFG Sprint 或新增 CFG-029+
- 详见 [TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md](../../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)

## PER · 配置锚点（PER2-X-01）

手测 Session 引用的链地址 / 端口以 **仓库根 `.env` + `frontend/.env.local`（sync 脚本）** 为 ① 运行时真源；**勿**在 Session 内硬编码已归档的 `B407_*` 或 `:3000` CORS。复验：`bash scripts/dev/verify-cfg-drift-closure.sh`。

