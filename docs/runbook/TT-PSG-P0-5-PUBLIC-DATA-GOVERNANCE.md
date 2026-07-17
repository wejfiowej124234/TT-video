# PSG P0⑤ · Public Data Governance（Foundation）

**STATUS:** `FOUNDATION_READY` · 关闭须 **Phase B** 全矩阵运行态认证  
**Production GO:** `NO_GO` · **PF Step 5:** `FROZEN` · **Deploy:** **DEFERRED**  
**Phase B:** [TT-PSG-PHASE-B-PUBLIC-SURFACE-CERTIFICATION.md](./TT-PSG-PHASE-B-PUBLIC-SURFACE-CERTIFICATION.md)  
**Machine key:** `TT_PSG_P0_5_PUBLIC_DATA`  
**Parent:** [TT-PUBLIC-SURFACE-GOVERNANCE.md](./TT-PUBLIC-SURFACE-GOVERNANCE.md)

---

## 0 · 目标

数据库与 Public API **天然隔离**生命周期；禁止 Guest「一把梭」混查。

---

## 1 · 生命周期分区（写死）

| `data_origin` / 等价 | Guest 公开目录 |
|----------------------|----------------|
| `production` | ✅ 可见（且须 published） |
| `test` | ❌ |
| `demo` | ❌ |
| `historical` | ❌（被取代克隆 · 不 DELETE） |
| `archived`（实体 status/publish） | ❌ |

> `archived` 优先落在 **publish_status / status / display_status**；`data_origin=historical` 用于行级血缘归档。

---

## 2 · Public API 强制契约字段

**机读实现（Market Guest）：** `crates/api/src/chain_off/psg_guest_contract.rs` · `psg_guest_contract.v1`  
响应 `meta.psg_guest_contract.server_enforced` 为可审计证明；**禁止**前端猜测字段。  
Guest list DB 谓词：`status=published AND data_origin=production`。

## 2b · 契约字段表

任何公开列表/详情（Guest）响应**必须能判定**下列语义（列上或 payload 内或稳定派生）：

| 字段 | 含义 |
|------|------|
| `lifecycle` / `publish_status` / `status` | 发布生命周期 |
| `visibility` / `display_status` | 展示可见性 |
| `publish_status` | CMS 族必填 |
| `data_origin` | 生产/测试/演示/历史 |
| `catalog_source` / `cover_source` | 是否正式 catalog |

缺字段且无法服务端强制过滤 → **Contract FAIL**。

**当前诚实缺口（Foundation 记录）：** Market Guest DTO 现多为 `{id,payload,updated_at}` — 过滤在服务端；**整合部署前**须补齐契约暴露或 documented server-enforced filter + Gate 证明不可混源。

---

## 3 · 硬规则

1. Guest 查询默认 `data_origin=production` **且** published。  
2. Admin/内部探针可看非 production；**不得**与 Guest 共用无过滤 handler。  
3. 禁止 DELETE 清测试数据伪装隔离；用 origin / archive。  
4. UPSERT / canonical_key（P0②）与本分区正交：幂等 ≠ 公开资格。

---

## 4 · Gate

```bash
node scripts/gates/check-psg-public-data-isolation.cjs
STAGING_API_BASE=https://tt-api-staging.fly.dev node scripts/gates/check-psg-public-data-isolation.cjs
```

**CLOSE：** **B1–B5** + **破坏性套件** + **`TT_PSG_PRODUCTION_CERT=PASS`**；全表面混源 = 0 且 Guest Contract 一致。  
**禁止**仅 `PASS_RUNTIME_SAMPLE` 冒充 P0⑤ CLOSED。  
**禁止**在 P0⑤ 未 CLOSED 时解冻 PF Step 5。

---

## 5 · Deploy / Phase B

与 P0③ 在终闸 PASS 后同批标 CLOSED；**不**单独为 accounts-under-freeze 提前部署。
