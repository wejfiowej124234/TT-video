# 178 · Phase ② Full-Coverage Validation Blueprint

**Version:** 1.0.0 · **最后更新：** 2026-06-08  
**受众**：工程 · QA · SRE · Owner  
**状态**：**ACTIVE · ② 测试网**  
**纪律**：**功能冻结** · ops harness only · **禁止**新增业务功能代码

> **SSOT**：Phase ② **Full-Coverage Validation（P2FC）** 程序入口。**裁定**见 [179 Report](./179-Phase2-Full-Coverage-Validation-Report.md)。  
> **一键（② · graduation-aligned）**：`bash scripts/ops/phase2-full-coverage-validation.sh`  
> **毕业编排 SSOT**：`bash scripts/dev/run-phase2-graduation-closure-program.sh`

**严格策略**：`all_checks_GO · no FAIL · no PARTIAL · no uncovered`

---

## 1. 验证域与 Track 映射

| Track | ID 前缀 | 覆盖域 |
|-------|---------|--------|
| **A · Business** | P2FC-T* | 五角色链 · ROV Wave-1/2 · 治理 Gap |
| **B · Exceptions** | P2FC-E* | 取消 · 重复提交 · 退款 · 会话/钱包 · 网络中断 · 回滚 |
| **C · Consistency** | P2FC-D* | DB↔API↔Admin↔Growth PG 一致性 |
| **D · Web3 & Community** | P2FC-W* | 钱包/治理 · 举报/审核/处罚 |
| **E · Browser & Mobile** | P2FC-B* / P2FC-M* | Chrome/Edge/Firefox/Safari · iOS/Android 仿真 |
| **F · Fault deps** | P2FC-F* | B-480 探针 · 邮件/存储/CDN/支付可达性 |
| **G · Soak** | P2FC-S* | **72h** API 健康稳定性 |

---

## 2. 检查项清单（33 项 · 机读 `results.tsv`）

| ID | 检查项 | Harness |
|----|--------|---------|
| P2FC-P00 | 基线冻结 12/12 | `check-rov-01-baseline-freeze.sh` |
| P2FC-T01 | 五角色业务链 | `rov-wave1-t2-business-chain.sh` |
| P2FC-T02 | ROV Wave-1 包 | `rov-wave1-evidence-pack.sh` |
| P2FC-T03 | ROV Wave-2 包 | `rov-wave2-evidence-pack.sh` |
| P2FC-T04 | 治理 Gap 收口 | `pra-governance-gap-closure.sh` |
| P2FC-E01 | 订单取消异常 | `b409-order-state-exception-acceptance.sh` |
| P2FC-E02 | 重复提交 | `cargo test duplicate_` |
| P2FC-E03 | 退款/webhook | H3 staging 或 local B-409 primary |
| P2FC-E04 | 会话/钱包/2FA | `smoke-phase25-h4-*` |
| P2FC-E05 | 网络中断探针 | connect-timeout 探针 |
| P2FC-E06 | Cold Start 回滚 | `rov-wave2-t4-cold-start.sh` |
| P2FC-D01 | 跨域 PG 一致性 | `cdia-phase2-pg-consistency-audit.py` |
| P2FC-D02 | 订单/托管 PG | `oed-phase2-pg-consistency-audit.py` |
| P2FC-D03 | 社区 PG | `community-phase2-pg-consistency-audit.py` |
| P2FC-D04 | Growth 漏斗 | `rov-wave1-t3-growth-funnel.sh` |
| P2FC-W01 | Web3 行程链 | `smoke-web3-itinerary-full-chain-local.sh` |
| P2FC-W02 | 治理 UAT | `smoke-governance-uat-p0-local.sh` |
| P2FC-W03 | 社区深审 | `run-community-deep-audit.sh` |
| P2FC-W04 | 社区审核 C3 | `smoke-community-c3-staging-moderation.sh` |
| P2FC-B01..04 | 桌面四浏览器 | Playwright `playwright.p2fc-staging.config.ts` |
| P2FC-M01..02 | 移动仿真 | iPhone 13 · Pixel 5 |
| P2FC-F01..03 | B-480 故障段 | `b480-prod-fault-injection-acceptance.py` |
| P2FC-F04..07 | 第三方可达性 | /meta · /health 探针 |
| P2FC-S01 | **72h Soak** | `p2fc-track-soak.sh` · **`P2FC_SOAK_SEC=259200`** |

---

## 3. 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `P2FC_DIR` | `evidence/PHASE2_FULL_COVERAGE/full-<stamp>` | 证据根 |
| `P2FC_SOAK_SEC` | `259200` | 72h · 缩短仅用于调试（**不能**全 GO） |
| `P2FC_INCLUDE_SOAK` | `1` | strict 模式下必须为 1 |
| `DATABASE_URL` | local PG | 一致性/Growth 探针 |
| `SEED_TEST_ACCOUNTS` | `1` | 角色链 |

---

## 4. 证据包结构

```
evidence/PHASE2_FULL_COVERAGE/full-<stamp>/
├── full_coverage_manifest.v1.json
├── results.tsv
├── PHASE2_FULL_COVERAGE_SUMMARY.md
├── EVIDENCE_PACK_FILELIST.txt
└── tracks/{business,exceptions,...}/
```

---

## 5. 与 147/158 边界

P2FC **② 全量验证 GO** **不替代** **147 Production GO** 或 **158 PI3 深审 GO**。
