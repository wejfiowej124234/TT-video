# TT-TEST-ACCOUNTS-QUICK-REFERENCE

**一页 SSOT · 日常手测打开即用**  
**Immutable IDs：** C1 · C2 · C3 · C4 · E1 · E2（语义永久 · 邮箱可换 · 见 Registry）  
**Registry：** [test-accounts-business-immutable.v1.yaml](../../registry/test-accounts-business-immutable.v1.yaml)  
**完整规范：** [TT-LOCAL-TEST-ACCOUNTS-MATRIX.md](./TT-LOCAL-TEST-ACCOUNTS-MATRIX.md)  
**变更闸门：** [TT-TEST-ACCOUNT-CHANGE.md](./TT-TEST-ACCOUNT-CHANGE.md)

---

## Immutable ID → 用途（语义永不改）

| ID | business_role | 当前邮箱 |
|----|---------------|----------|
| **C1** | MultiIdentityHubSteward | `multi-demo@test.com` |
| **C2** | TouristTraveler | `tourist@test.com` |
| **C3** | GuideWorkbench · Escrow **B** | `guide@test.com` |
| **C4** | MerchantProvider | `merchant@test.com` |
| **E1** | TrustGateCatalogGuide · Escrow **A** · **Local only** | `tg_guide_main@trustgate-e2e.local` |
| **E2** | DidRankDemoProvider | `provider-did-rank-demo@test.com` |

> **C2\***：同 ID + Step **6b2** = Admin SuperAdmin 捷径（≠ RBAC 六角色）  
> **治理：** 破坏性语义变更 → **新增 ID** · 禁止改现有 ID 含义

---

## Staging（② 测试网 · 推荐手测）

```
https://tt-web-staging.fly.dev
Password: Test123!
```

**IDs：** C1 · C2 · C3 · C4 · E2（**不含 E1**）

---

## Local（① 本地）

```
http://localhost:3012
http://127.0.0.1:8080
Password: Test123!
起栈: scripts\start-api-with-seed.bat
```

**IDs：** C1 · C2 · C3 · C4 · **E1** · E2

---

## 五秒选号

| 要测什么 | ID |
|----------|-----|
| 旅行者 | **C2** |
| 向导 · 链 B | **C3** |
| 商家 | **C4** |
| 多身份 / 主理人 | **C1** |
| DID 榜 | **E2** |
| Escrow catalog（Local） | **C2 + E1** |
| Escrow 链 B | **C2 + C3** |
| `/admin` 开发捷径 | **C2** + 6b2 |

---

## 账号关系（配对）

```text
Escrow B:  C2 ──► C3     Escrow A (Local):  C2 ──► E1
Merchant:  C4            Governance:  C1            Ranking:  E2
```

---

## 禁止（写死）

| 禁止 | |
|------|--|
| × 修改 C1–E2 **语义**（只能换邮箱或新增 ID） | |
| × Business 验 RBAC · Admin 验业务 | |
| × Local/Staging 混 Session | |
| × **E1** on Staging | |
| × **C1** 从零主理人入驻 | |

---

## Admin（§10 · 动态 Ephemeral）

| 场景 | 方式 |
|------|------|
| 开发 `/admin` | **C2** + 6b2 |
| 六角色 RBAC | `adm-rbac-*`（Local）· `adm-u01-*`（Staging） |

---

## 机读键

```text
TT_TEST_ACCOUNTS_QUICK_REF: ACTIVE
TT_TEST_ACCOUNTS_IMMUTABLE_IDS: C1,C2,C3,C4,E1,E2
TT_TEST_ACCOUNT_CHANGE: REQUIRED_FOR_EMAIL_OR_ID_CHANGES
TT_TEST_ACCOUNTS_GOVERNANCE: BACKWARD_COMPATIBLE_ADD_NEW_ID_ON_BREAK
```
