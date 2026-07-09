# Country Market Go-Live Playbook v1

> **SSOT**：BE-GCM-01 · Sprint 168 · Business Expansion  
> **关联**：[140 C-S5 Geo Validation](../handbook/engineering/140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md) · [101 CMS 蓝图](../handbook/engineering/101-CMS与内容运营中心实施蓝图.md) · [168 实施方案](../handbook/engineering/168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md)  
> **阶段**：**① 本地 / ② 测试网** — 本 playbook **不** 宣称 ③ Production GO  
> **版本**：`country_market_playbook.v1`

---

## 1. 目的与适用范围

本 playbook 将 **逐国开市场** 从 ad-hoc 协调转为 **可复制的七阶段 SOP**，每阶段含：

- 人工 checklist（Legal / Ops / Catalog / Compliance）
- 机读 gate（Admin API + C-S5 geo probes）
- 审计证据目录（`evidence/country_market/{iso}/`）

**适用**：新增或恢复某一 **ISO3166-1 alpha-2** 辖区（如 `CN`、`JP`、`TH`）的 **catalog 发布 + 市场可见 + region_steward 绑定准备**。

**不适用**：链上 CountryPool epoch 部署（BE-RS-02）、Production cutover（PI3-006）、Consumer PG geo 默认切换（120 冻结）。

---

## 2. 七阶段流程

| Phase | 代号 | 目标 | 自动化 gate | Owner 角色 |
|-------|------|------|-------------|------------|
| **0** | `INTAKE` | 立项 · 选国 · 指定 Launch Owner | Admin 创建 `country_market_launches` draft | Ops Lead |
| **1** | `LEGAL` | 法律/合规材料齐备 | checklist.legal.* = pass | Compliance |
| **2** | `CATALOG` | CMS 国家/城市/POI 草稿就绪 | catalog_country exists · cities ≥ N | Content Ops |
| **3** | `GEO` | meta.product_countries 对拍 | C-S5 meta-parity **PASS** | Content Ops |
| **4** | `STEWARD` | region_steward 候选绑定 | steward_user_id 记录 · 准入 checklist | Growth/Ops |
| **5** | `PUBLISH` | catalog country **published** | publish workflow + geo summary green | Content Ops + SuperAdmin |
| **6** | `LIVE` | 市场激活 · 审计归档 | launch phase=`live` · evidence bundle | Ops Lead sign-off |

```mermaid
flowchart LR
  INTAKE --> LEGAL --> CATALOG --> GEO --> STEWARD --> PUBLISH --> LIVE
```

---

## 3. Phase 0 · INTAKE（立项）

### 3.1 人工 checklist

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L0-01 | 目标 ISO 在 [84 十国表](../spec/84-第一阶段10国Country-Pool发行参数总表.md) 或 Owner 批准扩围 | 书面批准链接 |
| L0-02 | Launch Owner + Backup 指定 | Admin user id 记录 |
| L0-03 | 与 RegionShare / 链上 pilot 范围对齐 | 无冲突声明 |

### 3.2 机读动作

```http
POST /api/v1/admin/country-market/launches
{
  "jurisdiction_iso": "JP",
  "catalog_country_id": "<uuid|null>",
  "owner_user_id": "<ops_uuid>"
}
```

### 3.3 证据

`evidence/country_market/JP/intake.json` — Owner、日期、扩围批准引用。

---

## 4. Phase 1 · LEGAL（合规）

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L1-01 | 辖区服务条款/隐私披露版本号 | `checklist.legal.tos_version` |
| L1-02 | 支付/退款政策覆盖该国 | `checklist.legal.payment_policy_ref` |
| L1-03 | 数据驻留/跨境传输评估 | `checklist.legal.data_transfer` ∈ {approved, not_applicable} |
| L1-04 | KYC/AML 触发阈值（若适用） | Compliance 签字 |

**Gate**：`PATCH …/launches/:id/checklist` 全部 L1 项 `pass` → phase 可推进 `CATALOG`。

---

## 5. Phase 2 · CATALOG（内容）

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L2-01 | `catalog_countries` 行存在 · iso3166 正确 | Admin GET countries |
| L2-02 | ≥1 `catalog_cities` published 或 in_review | count ≥ 1 |
| L2-03 | 官方行程模板关联该国（O-S3） | optional P1 |
| L2-04 | 国家 display_name_zh/en 与 marketing 一致 | Content 对拍 |

**Gate**：`GET /admin/content/countries?iso=JP` 返回目标行。

---

## 6. Phase 3 · GEO（C-S5 对拍）

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L3-01 | C-S5 summary 加载成功 | `GET …/catalog/geo-validation` |
| L3-02 | meta.product_countries 逐国 parity | `meta-parity` **pass** for ISO |
| L3-03 | drift 无 CRITICAL | drift list empty or acknowledged |
| L3-04 | read_source 记录入 launch | snapshot in checklist |

**Gate（机读）**：

```bash
bash scripts/dev/smoke-admin-content-catalog-geo-validation-p0-local.sh
# + launch-specific: meta-parity row for JP status=match
```

---

## 7. Phase 4 · STEWARD（区域运营商）

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L4-01 | region_steward 候选 user 已注册/审批 | user_id |
| L4-02 | 该国 referral/region 码策略确认 | metadata |
| L4-03 | RegionShare 分润叙事与 83/84 一致 | doc ref |
| L4-04 | **不** 在本阶段宣称链上 epoch live | 133/165 边界 |

**Gate**：`checklist.steward.user_id` 非空 · Compliance 知悉。

> **BE-GCM-02**（P1）：全自动化 steward workflow — v1 仅记录 + 人工确认。

---

## 8. Phase 5 · PUBLISH（Catalog 发布）

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L5-01 | submit → publish workflow 完成 | publish_status=published |
| L5-02 | Geo validation **复跑** post-publish | L3 gates 仍 PASS |
| L5-03 | SuperAdmin 或 publish 权限审计 | admin_audit_logs |

**Gate**：

```http
POST /api/v1/admin/content/countries/:id/publish
```

**禁止**：在未完成 L1–L4 时自动 publish（Admin gate 见 168 §4.3）。

---

## 9. Phase 6 · LIVE（市场激活）

| # | 项 | Pass 标准 |
|---|-----|-----------|
| L6-01 | Launch phase → `live` | PATCH launch |
| L6-02 | `launched_at` 时间戳 | DB |
| L6-03 | Ops 公告/内部 comms 完成 | checklist.ops.comms |
| L6-04 | 证据包归档 | `evidence/country_market/{iso}/go-live-bundle/` |

**Gate**：

```http
POST /api/v1/admin/country-market/launches/:id/activate
```

**v1 范围**：**不** 切换 `CATALOG_SERVER_GEO_VALIDATION` 默认值（120 程序）；仅 **Admin 可观测 + checklist 闭环**。

---

## 10. 失败与回滚

| 场景 | 动作 |
|------|------|
| GEO parity 失败 | 停止 publish · 修复 catalog/core · 复跑 C-S5 |
| Legal 撤回 | phase → `archived` · unpublish catalog（若已发） |
| Steward 变更 | 更新 checklist · **不** 自动改链上席位 |

---

## 11. 运营 RACI

| 活动 | Ops | Content | Compliance | SuperAdmin |
|------|-----|---------|------------|------------|
| 创建 launch | R | C | I | I |
| Legal checklist | C | I | **A/R** | I |
| Catalog 编辑 | C | **R** | I | I |
| Geo validation | C | **R** | I | I |
| Publish | C | R | C | **A** |
| Activate live | **R** | C | C | A |

R=Responsible · A=Accountable · C=Consulted · I=Informed

---

## 12. 审计闭环

每次 phase 推进写入：

1. `admin_audit_logs` — action `country_market.launch.phase.*`
2. `country_market_launches.checklist` JSONB 快照
3. 可选 `evidence/country_market/{iso}/` 目录

**月度 ops 复核**：所有 `live` launches 复跑 L3 geo gate；drift → ticket。

---

## 13. 模板 · 新国家快速复制

1. 复制 `evidence/country_market/_TEMPLATE/` → `{ISO}/`
2. `POST …/launches` with `{ISO}`
3. 按 §3–§9 顺序勾选；**不可跳 phase**
4. `bash scripts/dev/run-country-market-launch-gate.sh --iso={ISO}` exit 0

---

*Country Market Go-Live Playbook v1 · BE-GCM-01 · Sprint 168*
