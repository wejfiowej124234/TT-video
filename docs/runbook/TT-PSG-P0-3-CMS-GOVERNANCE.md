# PSG P0③ · CMS Governance（Foundation）

**STATUS:** `FOUNDATION_READY` · 关闭须 **Phase B** 全公开面 Guest Published-only Runtime Cert  
**Production GO:** `NO_GO` · **PF Step 5:** `FROZEN` · **Deploy 46af7c70:** **DEFERRED**  
**Phase B:** [TT-PSG-PHASE-B-PUBLIC-SURFACE-CERTIFICATION.md](./TT-PSG-PHASE-B-PUBLIC-SURFACE-CERTIFICATION.md)  
**Machine key:** `TT_PSG_P0_3_CMS_GOVERNANCE`  
**Parent:** [TT-PUBLIC-SURFACE-GOVERNANCE.md](./TT-PUBLIC-SURFACE-GOVERNANCE.md)  
**Workflow SSOT:** `registry/traveltrust-operations-workflow.v1.yaml`

---

## 0 · 目标（不是改 CMS 页面）

建立**所有公开面**共用的 CMS 生命周期与读取边界。  
任何公开页（Home / Guide / Provider / Acquisition / Community / Campaign / Hero / Banner / Ambient / Official Guide）**只**通过本规则消费内容。

---

## 1 · 产品语言 ↔ 机读状态

| 产品语言 | 机读 `publish_status` | 说明 |
|----------|----------------------|------|
| Draft | `draft` | 可编辑 · Guest 不可见 |
| Review | `in_review` | 提交审核 · Guest 不可见 |
| Approved | *(transition)* `approve_and_publish` | **不是**独立 enum；审核通过并发布的闸门动作 |
| Published | `published` | **唯一** Guest 可读终态之一 |
| Archived | `archived` | 下线可追溯 · Guest 不可见 |

**禁止**新增第五个 DB enum 名叫 `approved`（与既有 TTOW / catalog CHECK 冲突）。  
**必须**在审计/Board 中把「Approved」记为 **transition evidence**，不是行状态。

---

## 2 · 硬规则

1. **Guest 永远只能读取 `published`**（catalog / announcements / roadmap / media 绑定实体）。  
2. **Admin Preview ≠ Guest**：Preview 走 Admin 鉴权路由；Guest 路由禁止 `include_draft` / `status=` 绕过。  
3. **发布必须版本化**：每次 publish 留下 revision / history / audit（既有 admin audit 或 entity history）。  
4. **下线必须可追溯**：`published → archived`（或 unpublish→draft）写审计；禁止 DELETE 伪装下线。  
5. **Publish / Unpublish 必有审计记录**（actor · entity · from→to · timestamp）。  
6. **统一调用**：公开页不得直读未治理表绕过 `publish_status=published` 过滤。

---

## 3 · 实体覆盖（统一）

| Entity 族 | Guest 入口 | 过滤 |
|-----------|------------|------|
| Catalog countries/cities/pois/media/… | `GET /api/v1/catalog/*` | `publish_status=published` |
| CMS announcements | public announcements | governed view published-only |
| Roadmap | public roadmap | published-only |
| Market listings（业务壳） | `…/listings` | `status=published` + data_origin 见 P0⑤ |
| Official Guide / Community posts | 各公开 feed | display/publish 治理态 |

---

## 4 · Gate

```bash
node scripts/gates/check-psg-cms-lifecycle.cjs
STAGING_API_BASE=https://tt-api-staging.fly.dev node scripts/gates/check-psg-cms-lifecycle.cjs
```

**CLOSE 条件：** **B1–B5** 全 PASS + **破坏性套件**全 PASS + **`TT_PSG_PRODUCTION_CERT=PASS`** 后，方可标 CLOSED。  
**禁止**仅 Market / 样本 PASS 冒充 P0③ CLOSED。  
**禁止**在 P0③ 未 CLOSED 时解冻 PF Step 5。

---

## 5 · 与 Deploy / Phase B 的关系

走 **Phase B 五域 + 破坏性 + 终闸**（非单独修 CMS 页）。  
与 P0⑤ 在 `TT_PSG_PRODUCTION_CERT=PASS` 后同批标 CLOSED；**不**单独推 `46af7c70`。
