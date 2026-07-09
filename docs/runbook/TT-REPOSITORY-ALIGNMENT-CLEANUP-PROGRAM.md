# TT Repository Alignment & Cleanup Program

**Program ID:** `TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM`  
**Version:** v1-20260616  
**Phase:** ② Sepolia · GovFreeze V2 Clean Baseline  
**Mode:** **Alignment & cleanliness only** — **≠** governance logic audit · **≠** new coverage matrix

---

## 唯一真源

| 层 | SSOT |
|----|------|
| **经济 / 合约** | [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) |
| **146 行执行** | [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](../spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) |
| **Cert 轨** | MTM + `evidence/GO_ttg_cert/` · AI 预验收 `evidence/GO_ai_pre_human_uat/` |

---

## 禁止

- 新增治理**功能**审计 · 覆盖率报告 · Tokenomics 矩阵  
- 重跑 Enterprise HAT / four-ledger / GovFreeze assert 作为「完成度」  
- 用本程序冒充 Cert #1～#12 Human/Ops/DR 签字  

## 允许

- 全仓 **ACTIVE / LEGACY / DELETE_CANDIDATE** 三类清单  
- 旧路由 · 旧脚本 · 旧地址 · 旧证据 · 旧叙事 · 死代码 · 权限/页/API/文档不一致  
- 最终**仓库对齐与清理执行清单**

---

## 执行

```bash
bash scripts/dev/run-tt-repository-alignment-cleanup-scan.sh
```

**产出：** `evidence/GO_repository_alignment_cleanup/<stamp>/`

| 文件 | 内容 |
|------|------|
| `REPOSITORY-ALIGNMENT-INVENTORY.v1.json` | 机读全量清单 |
| `REPOSITORY-ALIGNMENT-EXECUTION-CHECKLIST.md` | 人工执行序 |
| `BASELINE-ANCHORS.json` | GovFreeze V2 证据锚（只读） |

**机读键：** `TT_REPO_ALIGN: ACTIVE=… LEGACY=… DELETE_CANDIDATE=…`

---

## 三类定义

| Tier | 含义 |
|------|------|
| **ACTIVE** | 与 GovFreeze V2 基线一致 · 当前 runtime / 文档 / 证据真源 |
| **LEGACY** | 归档 · cutover 只读 · superseded 旁证 · **禁止**作活跃读口 |
| **DELETE_CANDIDATE** | 无引用 / 路由漂移 / 叙事冲突 / 重复 evidence · **须 Owner 确认后删** |

---

## 清理执行序（P0→P3）

1. **P0** — ACTIVE 地址误用 · 路由 `proposals/create`→`new` · Admin/Treasury 边界文案  
2. **P1** — 文档旧分红叙事 · legacy 地址无 LEGACY 注释  
3. **P2** — 死组件 · superseded Full Coverage Matrix 标 LEGACY  
4. **P3** — 旧 evidence stamp 压缩（**不删** latest · baseline freeze 锚）

---

## 诚实边界

- 本程序 **≠** ③ Production GO  
- Inventory **≠** 自动删除 — DELETE_CANDIDATE 需逐项 Owner 签核  
- **① 五主 UI 冻结** — 清理不得触 layout lock

---

**Gate-2.4：** **G24-REPO-ALIGN-01**
