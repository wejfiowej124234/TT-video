# Phase 2.5 · Coverage Hardening（写路径盲区最小补证）

**生效：** 2026-06-06  
**边界：** **≠** 重开 `PHASE2_GO_READY` · **≠** Phase ③ Production Preparation · **≠** Production GO · **不**新增产品功能  

**机读判定：** `TT_PHASE2_COVERAGE_HARDENING: PASS`（2026-06-06T10:35:27Z · staging Fly）  
**证据根：** [`evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/latest/`](../../evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/latest/)  

---

## 0 · 目的与范围

在 **BL-B01～BL-M09 覆盖盲区清单** 基础上，按风险序仅补强 **五类高风险写路径** 的 **staging 可重复验证链**（Runbook + Matrix 增补 + 证据包）。  
**不**改变 Phase ② GO 闸口径；**不**拉 Phase ③ 阻塞项回 ②。

| 序 | 类别 | Runbook 切片 | Staging 烟测 |
|----|------|-------------|-------------|
| 1 | Escrow / Intent / Dispute | CH-H01 | `smoke-phase25-h1-escrow-intent-dispute-staging.sh` |
| 2 | 收购接单 + 履约押金 | CH-H02 | `smoke-phase25-h2-acquisition-fulfillment-staging.sh` |
| 3 | Stripe Webhook 异常 + 退款 | CH-H03 | `smoke-phase25-h3-stripe-webhook-exceptions-staging.sh` |
| 4 | Session / Wallet Verify / 2FA | CH-H04 | `smoke-phase25-h4-session-wallet-2fa-staging.sh` |
| 5 | Stake / Release / Claim 链上写 | CH-H05 | `smoke-phase25-h5-chain-write-staging.sh` |

**一键复跑：**

```bash
STAGING_API_BASE=https://tt-api-staging.fly.dev \
  bash scripts/dev/run-phase25-coverage-hardening-staging.sh
```

可选：`PHASE25_SKIP_FORGE_DRYRUN=1`（H5 跳过 forge dry-run，引用 [`GO_phase2_chain_sepolia/`](../../evidence/GO_phase2_chain_sepolia/) 既有 dry-run 证据）  
可选：`STAGING_DATABASE_URL=…`（H4 追加 ADM-U02 2FA 写链全切片）

---

## 1 · 执行前审计（补证前缺口）

| 切片 | 补证前 | Matrix | Staging 证据 | Runbook |
|------|--------|--------|-------------|---------|
| **CH-H01** | R-003 12 条未含 B-ESC/B-DSP；UAT 无 `/escrow` | B-ESC-* / B-DSP-* **有案未跑** | **无** 专用包 | R-003 仅 §2.0 五连 |
| **CH-H02** | PD-009 Closing Gap 窄轨；无 fulfillment 门闸 staging | B-MKT-008 **无** listing→order 接单 | ① `smoke-acquisition-pd009-local.sh` | 无 staging 接单专条 |
| **CH-H03** | G4/G5 happy path；无异常剧本 | **无** CH-H03 用例 | G4 signed POST fallback | 无 invalid/refund 专条 |
| **CH-H04** | 93 §1 **无** sessions 用例；ADM-U02 需 DB | A-LOG-004 未进 R-003 | ① e2e / 局部 ADM-U02 | 无 bundler |
| **CH-H05** | G6 readonly；无 claim/stake tx | C-STK-001 MANUAL | G6 cast readonly | TT-9629 部署/只读 |

---

## 2 · 补证结果（2026-06-06 staging）

**API：** `https://tt-api-staging.fly.dev`  
**Verdict：** **5/5 PASS** · [`report.json`](../../evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/20260606T103421Z/report.json)

### CH-H01 · Escrow / Intent / Dispute

| 步骤 | 验证 | 结果 |
|------|------|------|
| seed `tourist@test.com` + `guide@test.com` | 登录 + `/me` guide.id | PASS |
| `POST /orders` → `accept` → `mock-pay` | 或 **复用** disputed 订单（guide slot 幂等） | PASS |
| `POST …/dispute` + `GET /disputes` | 争议可读 | PASS（复用 disputed 单） |
| `POST …/open-dispute-intent` 非法 body | **400** `invalid_intent` | PASS |
| `POST …/execute-resolution-intent` 非法 body | **400** | PASS |

**诚实边界：** 本轮因 seed guide 档期占用，主链 **复用** 订单 `fc1cd9e6-…`（state=disputed），未再跑 accept→mock-pay 全链；Intent/Dispute 负例与列表读 **已 staging 留证**。

### CH-H02 · 收购接单 + 履约押金

| 步骤 | 验证 | 结果 |
|------|------|------|
| `publish-bond` + 高赏金 listing | `bountyMaxUsdc≥1500` | PASS |
| 无 fulfillment-bond 接单 | **400** `acquisition_fulfillment_bond_required` | PASS |
| `POST …/fulfillment-bond` + `POST …/listings/:id/orders` | 接单创单 | PASS |
| `mock-pay` | **escrowed** | PASS |

### CH-H03 · Stripe Webhook 异常 + 退款冲正路径

| 步骤 | 验证 | 结果 |
|------|------|------|
| 无 `Stripe-Signature` | **400** `missing_stripe_signature` | PASS |
| 错误签名 | **400** `stripe_webhook_invalid_signature` | PASS |
| 签名 `charge.refunded`（合成事件） | **200** received（handler 可达） | PASS |

**未在本轮执行：** 真实 PI 全额退款 → entitlement 冲正 + Admin `financial-reversal`（需专用 test PI + `STAGING_DATABASE_URL`）。

### CH-H04 · Session / Wallet / 2FA

| 步骤 | 验证 | 结果 |
|------|------|------|
| `GET /me/sessions` 未登录 | **401** | PASS |
| `GET /me/sessions` 已登录 | **200** | PASS |
| `GET /me/security-notifications` | **200** | PASS |
| `POST …/wallet/verify/challenge` | **200** | PASS |
| `GET …/admin/security/totp/status` | **200**（promote_admin） | PASS |
| ADM-U02 全链 | `STAGING_DATABASE_URL` 未设 | **SKIP** |

### CH-H05 · Stake / Release / Claim

| 步骤 | 验证 | 结果 |
|------|------|------|
| `GET …/steward/stake-quote` | **200** | PASS |
| `GET …/redemption/quote?jurisdiction=CN` | **200** | PASS |
| `smoke-steward-stake-testnet-readonly.sh` | RPC **502** | WARN（HTTP 已验） |
| forge steward/redemption dry-run | `PHASE25_SKIP_FORGE_DRYRUN=1` | 引用 [`GO_phase2_chain_sepolia/`](../../evidence/GO_phase2_chain_sepolia/) |
| **链上 WRITE tx** | stake / release / claim | **N/A_BY_POLICY**（LEGAL/84 · Timelock owner） |

---

## 3 · 93 Matrix 增补（Phase 2.5 专用 · 不替代 93 正文）

| 用例 ID | 场景 | PASS 判据 | 自动化 |
|---------|------|-----------|--------|
| **CH-H02-001** | 收购大额接单无 fulfillment-bond | **400** `acquisition_fulfillment_bond_required` | `smoke-phase25-h2-*` |
| **CH-H02-002** | fulfillment-bond 后 `POST …/listings/:id/orders` | **200** + order.id | 同上 |
| **CH-H03-001** | Webhook 缺签名 | **400** `missing_stripe_signature` | `smoke-phase25-h3-*` |
| **CH-H03-002** | Webhook 错签名 | **400** `stripe_webhook_invalid_signature` | 同上 |
| **CH-H03-003** | 签名 `charge.refunded` | **200** received | 同上 |
| **CH-H04-001** | Session 列表鉴权 | 未登录 **401**；登录 **200** | `smoke-phase25-h4-*` |
| **CH-H04-002** | Wallet verify challenge | **200/400/501** 契约码（非 5xx） | 同上 |
| **CH-H05-001** | Sepolia quote 读面 + WRITE 边界声明 | stake-quote + redemption/quote **200**；WRITE **N/A**  documented | `smoke-phase25-h5-*` |

既有 ID **绑定复跑：** B-ESC-001/002、B-DSP-001、B-ESC-005、B-MKT-008、A-LOG-004、C-STK-001。

---

## 4 · 覆盖率提升摘要

| 维度 | 补证前（BL 清单） | 补证后 |
|------|------------------|--------|
| Escrow 写链 staging | 无专包 | **CH-H01 PASS**（含 Intent 负例） |
| 收购 fulfillment 门闸 | Matrix 缺口 | **CH-H02 PASS** + CH-H02-001/002 |
| Stripe 异常/退款 | 仅 happy path | **CH-H03 PASS**（3 异常探针） |
| Session/Wallet/2FA | 无 Matrix 行 | **CH-H04 PASS**（ADM-U02 仍 optional） |
| 链上 WRITE | 仅 readonly | **CH-H05 PASS** + 显式 WRITE=N/A |

**`TT_PHASE2_GO_VERDICT`：** **CLOSED (Evidence Reused)** · 仍为 `PHASE2_GO_READY`（Closing Gap 不受本轨影响）。

---

## 5 · 剩余盲区（补证后仍 OPEN）

| ID | 路径 | 原因 | 建议补证轨（非 Phase ③ 产品） |
|----|------|------|------------------------------|
| **RB-01** | Escrow **完整** accept→pay→complete→rating 每次新建订单 | seed guide 档期 + disputed 复用策略 | 专用 disposable guide 或 Admin resolve 清 slot |
| **RB-02** | EIP-712 Intent **正例**（真签名 + outbox） | 需钱包 + 链 ID 对齐 | 35/06 DApp smoke · 非 HTTP-only |
| **RB-03** | Stripe **真实** refund → entitlement 冲正 | 需 test PI + DB 对拍 | G4 扩展 runbook + Admin reversal |
| **RB-04** | ADM-U02 **staging DB** 2FA 写链 | 本轮 SKIP（无 `STAGING_DATABASE_URL`） | `record-adm-u02-staging-evidence.sh` |
| **RB-05** | `auth/refresh` staging | login 无 refresh_token | 启用 refresh 后补 A-LOG-004 |
| **RB-06** | Sepolia **stake/release/claim** 真 tx | LEGAL/84 + Timelock | ③ 链写 Runbook · 非 ② |
| **RB-07** | InvestorDistribution **Claim** 钱包写 | C-GOV-010 staging N/A | ③ 或 Anvil fork |
| **RB-08** | 收购 **trust parity** staging | PD-009 曾 SKIP | `smoke-acquisition-trust-parity` on staging |
| **RB-09** | Admin RBAC **71 页** 组合 | D-ADM 抽检 | ADM-U01 matrix + 扩展抽检 |
| **RB-10** | 主理人 B+A 双轨 staging | ① smoke only | `smoke-steward-onboarding` staging 专条 |
| **RB-11** | `execute-resolution-intent` **正例** | 需仲裁签名 | 争议闭环 Phase ③ |
| **RB-12** | RPC cast readonly 稳定性 | 502 间歇 | 换 RPC 或 CI 重试 |

---

## 6 · 证据包结构

```
evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/<stamp>/
  STATUS.txt
  report.json
  run.log
  CH-H01-run.log … CH-H05-run.log
  slices.txt
```

**最新：** [`20260606T103421Z`](../../evidence/GO_phase2_testnet_20260526/phase25-coverage-hardening/20260606T103421Z/)

---

## 7 · 关联 SSOT

| 文档 | 关系 |
|------|------|
| [`93-全站功能验证矩阵`](../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) | §3 增补 CH-H* 用例 |
| [`PHASE2-CLOSING-GAP.md`](./PHASE2-CLOSING-GAP.md) | **不修改** G1–G7 判定 |
| [`PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX.md`](./PHASE2-STAGING-UAT-PRODUCTION-READINESS-MATRIX.md) | 六大域 UAT **正交** |
| [`stripe-onboarding-testnet-lib.sh`](../../scripts/dev/stripe-onboarding-testnet-lib.sh) | H3 签名 helper 复用 |
