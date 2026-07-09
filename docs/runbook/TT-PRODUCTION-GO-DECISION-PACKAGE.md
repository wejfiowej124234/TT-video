# TT · Production GO Decision Package（唯一判据）

**Machine template:** [`registry/production-go-decision-package.v1.template.json`](../../registry/production-go-decision-package.v1.template.json)  
**Closure sequence SSOT:** [`registry/production-go-closure-sequence.v1.yaml`](../../registry/production-go-closure-sequence.v1.yaml)  
**Four-Gate Framework（Production GO 唯一权威 · 2026-07-08）：** [`PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md`](PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md) · `bash scripts/check-production-go-four-gates.sh`  
**Payment architecture SSOT:** [`registry/payment-architecture-classification.v1.yaml`](../../registry/payment-architecture-classification.v1.yaml)  
**G3 Domain:** **G3-06 Production Evidence** · [`G3-PRODUCTION-DOMAINS.md`](G3-PRODUCTION-DOMAINS.md)

> **Payment = Web3 Escrow (USDC)** · **Stripe = Optional Fiat Onboarding (P1)** — 不在 Four-Gate 主链。

---

## Production GO · Four-Gate 链（唯一权威 · 2026-07-08）

```text
Business Ready          ← L1 · 业务（~90%+ PASS）
        │
        ▼
Web3 Ready              ← L2 · USDC · PAY-W01..W16（P0 · NOT_STARTED）
        │
        ▼
Infrastructure Ready  ← L3 · Fly/PG/RPC/CDN/DNS/Backup/Monitor
        │
        ▼
Operations Ready      ← L4 · 全运营后台 UAT
        │
        ▼
Owner Sign-off
        │
        ▼
TT_PRODUCTION_GO = GO
```

详见 [`PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md`](PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md) · [`production-go-remaining-work.v1.yaml`](../../registry/production-go-remaining-work.v1.yaml)

---

## Production GO 链（G3 Domain · Legacy 并行）

## Production GO 链（写死）

```text
G3-01 VERIFIED → G3-02 VERIFIED → … → G3-06 VERIFIED
        ↓
Production GO Decision Package（G3-06 formal/）
        ↓
TT_PRODUCTION_GO = GO
```

---

**不要**靠聊天判断。  
**不要**靠文档 alone 判断。  
**不要**靠 Matrix alone 判断。

**最后只有一份：Production GO Decision Package。**

其中必须明确：

```text
G1 PASS
G2 PASS
G3 PASS
        ↓
Production GO
```

除此之外，任何 **「感觉可以上线」** 全部 **无效**。

---

## 无效权威（列举即禁止）

| 来源 | 能否单独决定 GO |
|------|------------------|
| Chat / AI  opinion | **否** |
| Runbook / 文档未签字 | **否** |
| Master Matrix 机读键未附 Decision Package | **否** |
| 主观 readiness | **否** |
| **Signed Decision Package + validator exit 0** | **是（唯一）** |

---

## Package 必填字段

| 字段 | 要求 |
|------|------|
| `machine_keys.TT_PRODUCTION_READINESS_G1_GATE` | **PASS** |
| `machine_keys.TT_PRODUCTION_READINESS_G2_GATE` | **PASS** |
| `machine_keys.TT_PRODUCTION_READINESS_G3_GATE` | **PASS** |
| `machine_keys.TT_PRODUCTION_GO` | **GO**（仅当上述三门 PASS + Owner 签字） |
| `g3_domains_complete` | **G3-01 … G3-06** 均为 **VERIFIED**（各域 `signoff.json` + evidence 引用） |
| `owner_attestation` | Owner 姓名 · decision · signed_utc |
| `artifacts` | Final PER · Launch Checklist · Launch Approval 路径 |

**禁止表述：** 「G3 基本完成」· 「差不多可以 GO」— 必须六域逐一 **VERIFIED**。

**Evidence 根目录：** `evidence/GO_production_readiness/G3-06/<stamp>/`（Decision Package 落盘于 G3-06 formal）

---

## 执行

```bash
# 填写 package 后机读校验（G3 Gate PASS 为前置）
node scripts/dev/validate-production-go-decision-package.cjs \
  --package evidence/GO_production_readiness/G3-06/<stamp>/formal/production-go-decision-package.json
```

**通过时：** 更新 Matrix `TT_PRODUCTION_GO: GO`（仅 validator 写入，禁止手工改键冒充 GO）。

**未通过时：** `TT_PRODUCTION_GO` 保持 **NO_GO**。

---

## 与历史决策包的关系

2026-06-07 的 [`PRODUCTION-GO-DECISION-PACKAGE.md`](PRODUCTION-GO-DECISION-PACKAGE.md)（Phase ③ PI3 轨）保留为**历史 NO_GO 记录**。

**当前 Release Train 唯一 GO 权威** 以 **本文件 + `production-go-decision-package.v1.json`** 为准（G1/G2/G3 Gate PASS 链）。

---

## 诚实边界

- G3 Gate PASS **≠** 自动 Production GO — 仍须 **G3-06 Decision Package** 签字 + validator  
- Production GO **≠** 主网真链 GO（若 scope 含 Mainnet，另闸 Shadow Launch / go-live §9）  
- ① 本地 **≠** ③ Production GO

**Production Retrospective（GO 之后）：** [`PRODUCTION-RETROSPECTIVE.md`](PRODUCTION-RETROSPECTIVE.md)
