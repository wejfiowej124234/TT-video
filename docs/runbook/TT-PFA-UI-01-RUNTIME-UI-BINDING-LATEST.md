# PFA-UI-01 · Web3 Runtime → UI Binding（Prep Only）

**Machine:** `TT_PFA_UI_01_RUNTIME_UI_BINDING`  
**Status:** **`CLOSED`** · verdict **`FINDING`** · Prep archived · `2026-07-19`  
**Prior record:** `2026-07-19T02:56:59Z` · `PFA_UI_01_FINDING`  
**Evidence:** `evidence/GO_pre_eta_production_prep/pfa-ui-01-runtime-ui-binding-20260719/`

> 确认：部分后台 Finding **已穿透**用户体验  
> **≠** Full UI/UX Acceptance · **≠** GO  
> F-02 WAIT_WINDOW · Frozen RC / Money-Path / Gate **不变** · **本窗禁 Fix**

| PASS | FINDING | NOT_RUN |
|------|---------|---------|
| 1 | 7 | 1 |

---

## Release Window · 最小修复候选（非本窗执行）

| Finding ID | 候选动作（Release Window only） | 本窗 |
|------------|--------------------------------|------|
| `PFA-UI-WALLET-01` | Owner 注入 WC Project ID → `KEY_PRESENT`（OA-H1） | **OWNER_ACTION**（KEY_ABSENT） |
| `PFA-UI-GOV-01` | Staging/FE build 钉 ACTIVE Governor（`0x1ce4…`）· 勿用 LEGACY example 当活配置 | **CLOSED**（Release Window） |
| `PFA-UI-GOV-02` | 随 `/meta` ACTIVE 对拍确认（鉴权后） | **CLOSED**（/meta ACTIVE match） |
| `PFA-UI-STEWARD-01` | FE stake pool 钉 ACTIVE（`0xc229…`） | **CLOSED**（Release Window） |
| `PFA-UI-ROLE-02` | 随 WC + ACTIVE FE 钉死后复验角色完成路径 | **BLOCKED_BY_WC** |
| `PFA-UI-ROLE-01` | Hub CTA / identities 契约复验 | **CLOSED**（vitest 14/14） |
| `PFA-UI-TRUST-01` | `/me/trust` → `/me/settings/trust` | **CLOSED**（next.config redirect）

**最小修复原则：** 只改配置/示例钉死 ACTIVE + WC 注入 · **禁止** Registry 改 · **禁止** Money-Path · **禁止** 全量 UI 重做。

### 不进 Release Window 最小修复（本窗/后续分轨）

| ID | 处置 |
|----|------|
| `PFA-UI-ADMIN-01` | **PFA-04** Access Boundary / RBAC Final Matrix |
| `PFA-UI-ROLE-03` | **PFA-04** live 角色矩阵 |
| `PFA-UI-TRUST-01` · `ESCROW-*` · `MARKET-01` · `PROV-01` | 设计/积压 · 非本批最小修复 |

---

## Surfaces（归档）

| Surface | result |
|---------|--------|
| WALLET (WalletConnect) | FINDING |
| GOVERNANCE | FINDING |
| TRUST | FINDING |
| ESCROW | FINDING |
| MARKET | FINDING |
| PROVIDER | PASS |
| STEWARD | FINDING |
| ADMIN | **NOT_RUN → PFA-04** |
| ROLE_NAV | FINDING |

**Agent default：** heartbeat only · 直至 `execute_allowed_now=true` → Operator Card ENTRY。
