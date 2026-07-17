# TT · PSG Runtime Change Propagation Gate（Post-PSG Change Control）

**Status:** `ACTIVE`  
**Machine:** `TT_PSG_RUNTIME_CHANGE_PROPAGATION`  
**Registry:** [`registry/psg-runtime-change-propagation.v1.yaml`](../../registry/psg-runtime-change-propagation.v1.yaml)  
**Gate:** `node scripts/gates/check-psg-runtime-change-propagation.cjs`  
**Evidence:** `evidence/GO_psg_governance/RUNTIME_CHANGE_PROPAGATION/`  

**层位（写死）：** Post-PSG Change Control · **不是** 冻结 Certification 的重开 · **不是** Tag/Archive 刷新  

---

## 0 · 诚实边界

| 断言 | 真假 |
|------|------|
| 本闸 PASS = Production Cert 刷新 | **假** |
| 本闸 PASS = `TT_PRODUCTION_GO` 翻转 | **假** |
| 本闸可改 Tag / Release Archive / 已冻结证据 | **禁止** |
| 本闸拦截「数据层先变、Web 配置未跟」类漂移 | **真（目标）** |

冻结基线仍以 Tag `v1.1.0-psg-go.20260717` / Dev Strategy FROZEN 为准。

---

## 1 · 现有 PSG 有没有 Runtime Change Propagation？

**结论：没有一等公民的 Runtime Change Propagation 闭环。**

| 现有能力 | 覆盖 | 对「绝对 Tigris URL + 缺 remotePatterns」 |
|----------|------|------------------------------------------|
| Admission Trio · SSOT Drift | 文档/脚本在场 | **不拦** |
| Admission Trio · Repro Build | 同 SHA 指纹 | **不拦** |
| Admission Trio · Env Align | `/meta` + media_caps **键名** | **不拦** |
| Runtime Cert | SHA→migration→CMS→COS→matrix | COS HEAD 过即可，**不打** `/_next/image` |
| COS Integrity P0④ | 对象 HEAD / ephemeral ban | 对象存在即 PASS，**不验 FE allowlist** |
| CFG Zero-Drift（已毕业） | CFG-001～028 配置面 | **未纳入** next.config remotePatterns 对活 URL |
| Phase② MEDIA_ALIGNMENT | 事后修复 MED-01..05 | **事后闭环**，非 PSG 准入闸 |

---

## 2 · 为何本次 Community/CMS Media 漂移未被拦截？

```
PSG GO (Tag 0bbc7adb)
  next.config 无 Tigris remotePatterns · 数据仍是 /api/v1/uploads → 组合可工作
        ↓
COS rebind (数据层) 2026-07-17T10:24:40Z
  API 吐绝对 Tigris URL · EnvAlign/COS 仍可 PASS（键名/对象 HEAD）
        ↓
Wallet rebuild 暴露 (v100)
  新 Web 镜像烘焙旧 next.config → /_next/image 400
        ↓
Wallet 增量审计
  范围不含 Community Media → Wallet PASS / Media FAIL
```

**缺口定位（三维）：**

1. **数据先变** — rebind 无「强制 Web 配置/探针同步」钩子  
2. **配置债** — Tag 时代 FE allowlist 未覆盖 COS permanent host  
3. **探针旧世界** — RC/EnvAlign 不验 `/_next/image` 对绝对 URL  

---

## 3 · Gap Matrix（维度 × 模块）

### 3.1 十六维（是否已纳入 PSG 管控）

| ID | 维度 | PSG 现状 | 本闸 |
|----|------|----------|------|
| D01 | Code / consumer | PARTIAL（合约/门禁分散） | 后续扩 |
| D02 | App config (`next.config`) | **GAP** | **RCP-MEDIA-01** |
| D03 | Env / NEXT_PUBLIC | PARTIAL | **RCP-MEDIA-04** |
| D04 | DB migration | PARTIAL（LF / Runtime Cert） | 后续 |
| D05 | Object storage / CDN | PARTIAL（COS HEAD） | 扩 CDN cutover |
| D06 | Media URL shape | PARTIAL | **RCP-MEDIA-03** |
| D07 | API contract | PARTIAL | 后续 |
| D08 | FE media consumer | **GAP**（PSG 层） | 经 D02+D12 |
| D09 | Feature flag | GAP | 后续 |
| D10 | Build args | **GAP**（PSG 层） | **RCP-MEDIA-04** |
| D11 | Deploy API↔Web sync | **GAP** | P0 设计项 |
| D12 | Probe live render | **GAP**（PSG 层） | **RCP-MEDIA-02** |
| D13 | Evidence | PARTIAL | 本闸写 evidence |
| D14 | Git / Tag discipline | COVERED（Dev Strategy） | 不改冻结 |
| D15 | Staging runtime | PARTIAL | 本闸打 Staging |
| D16 | Prod Candidate | PARTIAL（EnvAlign keys） | 后续扩 hosts |

### 3.2 模块扫描

| 模块 | 状态 | 优先级 | 说明 |
|------|------|--------|------|
| Community/CMS Media | PARTIAL→本闸加固 | **P0** | 已证缺口 |
| CMS/OCS | PARTIAL | **P0** | COS≠FE allowlist |
| Deployment API↔Web | GAP | **P0** | rebind 后未强制 Web 同步 |
| Testing / probes | PARTIAL | **P0** | 本闸补 next/image |
| Auth/Session | GAP | P1 | rewrite / API_BASE / cookie |
| Market/Guide covers | GAP | P1 | 同 media host 类 |
| Cache/CDN cutover | GAP | P1 | `cdn.traveltrust.app` |
| Wallet/Web3 / ABI | PARTIAL | P1 | 另有 Web3 env gates |
| Payment/Escrow | PARTIAL | P1 | |
| Secrets | PARTIAL | P1 | OA-01 独立 |
| Migration semantic | PARTIAL | P1 | |
| Indexer | GAP | P2 | |
| RBAC | GAP | P2 | |
| Observability | GAP | P2 | |
| i18n | DEFERRED | P3 | |

---

## 4 · 影响分析

| 若无本闸 | 影响 |
|----------|------|
| 任意 COS/CDN rebind | Staging 可「API 绿、页红」 |
| 仅重建 Web | 烘焙旧配置债再次暴露 |
| 窄切片审计（Wallet） | PASS 掩盖邻域 FAIL |
| Production Candidate | 可能复制同一漂移类 |

| 有本闸 | 影响 |
|--------|------|
| Staging Web deploy / rebind 后 | 强制 hosts ⊆ remotePatterns + `/_next/image` 200 |
| 不刷新冻结 Cert | 增量治理，合规基线策略 |

---

## 5 · 实施方案（增量 · 不重开 PSG Cert）

### Wave A（已落地 · P0 Media）

1. Registry `psg-runtime-change-propagation.v1.yaml`  
2. Gate `check-psg-runtime-change-propagation.cjs`（RCP-MEDIA-01..04）  
3. Evidence 目录 `evidence/GO_psg_governance/RUNTIME_CHANGE_PROPAGATION/`  
4. 触发建议：COS rebind 后 · Staging Web deploy 后 · `next.config` media 变更后  

```bash
node scripts/gates/check-psg-runtime-change-propagation.cjs
# expect: TT_PSG_RUNTIME_CHANGE_PROPAGATION: PASS
```

### Wave B（下一步 · P0 Deploy pair）

- 记录 Staging **API SHA** vs **Web image tag**；数据 rebind 事件必须附带 Web 重建或显式 WAIVE（Owner）  
- 不写入冻结 Archive  

### Wave C（P1 扩模块）

- Auth rewrite/API_BASE 对拍  
- Market/Guide cover hosts 并入同一 host 采样器  
- CDN cutover：`cdn.traveltrust.app` 从「配置预留」升级为「活 URL 必过」  

### Wave D（P2）

- Indexer / RBAC / Observability 传播清单（先矩阵后闸）  

---

## 6 · 最终治理清单（Owner）

- [x] 确认 PSG 无一等 Runtime Change Propagation → **建立本闸**  
- [x] 定位 Media 漂移逃逸路径 → RCA 写入 MEDIA_ALIGNMENT + 本 runbook §2  
- [x] 增量 Registry + Gate + Evidence（**未**动 Tag/Archive/Cert/`TT_PRODUCTION_GO`）  
- [ ] Wave B：API↔Web deploy pair 钩子  
- [ ] Wave C：Auth / Market / CDN 扩采样  
- [ ] 可选：在 `deploy-tt-web-staging.sh` **末尾非阻塞提示**调用本闸（勿绑死冻结 Cert）  
- [ ] 下一正式 Release 周期再评估是否升格为 Production Cert 子项（**新周期**，非本基线刷新）  

---

## 7 · 与 MEDIA_ALIGNMENT / Wallet 关系

```
Wallet L5                 Engineering Closed
MEDIA_ALIGNMENT           Engineering Closed   ← 事后修复批次
RUNTIME_CHANGE_PROPAGATION_GATE  ACTIVE        ← 防复发 · Post-PSG
OA-01                     WAIT Project ID
```

MEDIA_ALIGNMENT 关缺陷；本闸关**类缺陷复发**。二者均不重开 PSG Certification。
