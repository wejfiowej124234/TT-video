<!-- SUPERSEDED BY: evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260701T002252Z.md -->
> **ARCHIVED · SUPERSEDED BY:** `TESTNET-SIGNOFF-20260701T002252Z.md` · Do not use for gate decisions.  
> **Canonical keys:** `TT_TESTNET_SIGNOFF: CLOSED` · `TT_TESTNET_GRADUATION: CLOSED`

# ② Testnet Sign-off — Owner Preparation (G-09)

**Phase:** ② 测试网（staging · Sepolia · 真回调）— **≠ ③ Production GO**  
**Prepared UTC:** `2026-06-30T15:49:00Z`  
**Session:** `TN-20260630T144813Z` · `evidence/manual-uat/sessions/20260630T144813Z/`  
**Checklist SSOT:** [TT-TESTNET-SIGNOFF-CHECKLIST.md](../../docs/runbook/TT-TESTNET-SIGNOFF-CHECKLIST.md)

## 前置基线

| 项 | 值 |
|----|-----|
| ① Manual UAT | **27/27 PASS** · session `20260630T142222Z` |
| Configuration / PER | **FROZEN / GRADUATED**（本轮未重开） |
| Staging API | `https://tt-api-staging.fly.dev` |
| Staging FE | `https://tt-web-staging.fly.dev` |
| chain_id | `11155111` (Sepolia) |
| git SHA (local) | `987bc260cd4c4d409c317ddbf3c70d4c3d212a70` |
| staging `/meta/build.git_sha` | `f99958fa88294ccc624e2bd93ad39d85758784a9` |

## 清单结论（22 项）

| 状态 | 数量 | 项 |
|------|------|-----|
| **PASS** | **18** | T-ENV-01～04 · T-CHAIN-01～03 · T-ID-01 · T-HAT-01 · T-ORD-01 · T-PROV-01 · T-ACQ-01 · T-IDX-01 · T-PSP-01 · T-COM-01 · T-STK-01 · T-REG-01 · T-GRAD-01 |
| **PARTIAL** | **3** | T-RBAC-01 · T-GOV-01 · T-SIGN-01 |
| **BLOCKED** | **1** | T-ESC-01 |
| **FAIL** | **0** | — |

### 未闭项（诚实登记）

| ID | 状态 | 原因 | 解除条件 |
|----|------|------|----------|
| T-RBAC-01 | PARTIAL | API **102/102 PASS** (`run_20260630T153909Z`) · Playwright **4/6 角色**（Finance shell 超时 · Auditor 未跑）— **infra/FE 抖动，非 RBAC 业务缺陷** | 重跑 `record-adm-u01-staging-evidence.sh`（`ADM_U01_REQUIRE_PERSISTENT_HOST=1`）直至 6/6 角色 |
| T-GOV-01 | PARTIAL | staging API 读面 PASS（meta · steward auth proposals）· **MANUAL-P1 钱包 vote 未验** | Owner 钱包 Sepolia 治理 vote 旁证 |
| T-ESC-01 | BLOCKED | `B407_GUIDE_PK` 缺失/无效 · 仅 `PRIVATE_KEY`（staker） | Owner 提供 B407 Sepolia 密钥至 `scripts/dev/.env.staging-secrets.local` 后重跑 `record-tn-p1-006-escrow-staging-evidence.sh` |
| T-SIGN-01 | PARTIAL | 签字准备稿已生成 · **Owner G-09 终签待 22/22 或书面接受 PARTIAL/BLOCKED** | 关闭上三项后 Owner 将裁决键改为 CLOSED |

### F 轨证据锚点

| ID | 证据 |
|----|------|
| T-REG-01 | `defects-registry.json` · open **P0=0 P1=0**（P2: DEFECT-001/003 不计入）· `GO_phase2_open_burn_down/20260630T154707Z/` |
| T-GRAD-01 | `GO_phase2_testnet_graduation/20260630T154415Z/` · **blocking_open=0** · `tn_p1_010_graduation_pass=true`（`tn-p1-010-indexer-reconcile-20260630T153818Z` @ freeze `8dcd304a`） |
| T-STK-01 | `tn-p1-004-steward-stake-20260630T153904Z` · live readonly + fork write PASS |

## 签字行（§2）

| 项 | 值 |
|----|-----|
| 验收阶段 | ② 测试网 |
| ① 基线 | Manual UAT 27/27 PASS · Session `20260630T142222Z` |
| git SHA | `987bc260` |
| Reviewer | Sebastian Ward（准备稿 · 待 Owner 终签） |
| Date (UTC) | 2026-06-30 |
| 结论 | **18/22 PASS** · 3 PARTIAL · 1 BLOCKED |
| 裁决键 | **`TT_TESTNET_SIGNOFF: OPEN`** |

## 诚实边界

- 本准备稿 **≠** `TT_TESTNET_GRADUATION: CLOSED`（毕业审计 `graduation_verdict=PARTIAL` · deep_closure gap 仍 OPEN — 见 `20260630T154415Z`）
- 本准备稿 **≠** ③ Production GO
- ISS-007 窄切片 / ① 本地绿 **不得**冒充本清单 22/22 CLOSED

## Machine line

```
TT_TESTNET_SIGNOFF: OPEN
TT_TESTNET_SIGNOFF_PREPARED: 20260630T154900Z
TT_TESTNET_SIGNOFF_PASS: 18/22
TT_TESTNET_SIGNOFF_PARTIAL: 3
TT_TESTNET_SIGNOFF_BLOCKED: 1
```

---

*End of TESTNET-SIGNOFF preparation v1.0.0*
