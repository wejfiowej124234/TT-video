# TT · Governance Mutation / Authority Matrix（Pack 07 · LATEST）

**STATUS:** `PACK07_AUTHORITY_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改权限 / RBAC / Safe / Governor / Timelock / 合约 / Runtime）  
**Stamp:** `2026-08-18`  
**Machine:** [`registry/governance-economic-matrix.v1.yaml`](../../registry/governance-economic-matrix.v1.yaml)  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Gate:** `python scripts/dev/check-governance-mutation-authority-matrix.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M7_SHALLOW_AUTHORITY`:** **0** · **`M7_UNRESOLVED_MUTATOR`:** **0** · **`M7_AMBIGUOUS_AUTHORITY_SSOT`:** **0** · **`UNEXPLAINED_PRIVILEGE_PATH`:** **0**  
**本波 STOP：** Pack 07 CLOSED。Pack **08** 是独立后续波（见 [TT-SECURITY-IDENTITY-ACCESS-MATRIX-LATEST](./TT-SECURITY-IDENTITY-ACCESS-MATRIX-LATEST.md)），本包不拥有身份加深。  
**禁止：** 改 FTB / RBAC / Safe / Governor / Timelock · deploy / schedule / execute / cutover / 真钱 · 把 **CI-02** / PM $25 / **Proposal #3** / Seat Claim 画成当前 Official authority

Pack **03 / 04 / 05 / 06** 已闭合，只读引用。FTB `20260812` 是锁表。  
**硬规则：** **READ ≠ MUTATE ≠ ADMIN ≠ GOVERN ≠ EXECUTE**。Admin RBAC **不是** L7 owner。Indexer **不能**改链。CMS 发布 **不是** proxy upgrade。

---

## 0 · 活权威图（AS-IS）

```text
Safe 0x96491  owner 0xe1e732  threshold 1/1
  --admin--> Timelock 0x50F0B261  delay=172800 (48h)
Governor 0xD5819ac  (NEW TTG 25T votes) · LEGACY Governor 0x46Ce671
  --proposer--> Timelock
Timelock.execute  = permissionless after eta   (不是 OZ EXECUTOR_ROLE)
Timelock --owner--> OLD FR 0x2aF47C / SR-FT / Wired guardian / P4Cap
Timelock --EIP1967 admin--> OLD PM proxy LEGACY；$25 4e16 LEGACY；Official sale = NEW PM 0x882Ad 100_000
Official www chrome 仍 GOV-04 1e18 / 10→10 = Expected Difference（bake FORBIDDEN）
SuperAdmin --publish--> CMS/OCS PG (L6)     永不 L7
Ops/Risk  --moderate--> community PG (L6)   永不 L7
Indexer   --READ L7--> WRITE L8 projection only
FTB 20260812 LOCKED · 本波 maps 只有 READ
```

AXIS-05（2026-08-12）写「PM GOV-04 pending」相对 recon 是 **STALE**。Official `/meta` 售币已是 NEW PM 100_000。OLD proxy `$25` = **LEGACY**。Official www chrome 仍 1e18。剩余 WAIT = **CI-02 hop B**。

---

## 1 · 24 条权威（摘要）

| ID | 主体 | 特权类 | Runtime Status |
|----|------|--------|----------------|
| AUTH-TRAVELER-SELF | Traveler | MUTATE | CURRENT_OFFICIAL_LIVE |
| AUTH-GUIDE-SELF | Guide | MUTATE | CURRENT_OFFICIAL_LIVE |
| AUTH-PROVIDER-APPLY | Provider 申请 | MUTATE | CURRENT_OFFICIAL_LIVE |
| AUTH-STEWARD-APPLY | Steward 申请（PG） | MUTATE | CURRENT_OFFICIAL_LIVE |
| AUTH-STEWARD-CLAIM | 83 Seat Claim | GOVERN | **TARGET_NOT_LIVE** |
| AUTH-MODERATOR-COMMUNITY | Risk/Ops moderate（无独立 users.role） | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-ADMIN-OPS | users.role=admin → Ops | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-SUPERADMIN | super_admin 发布/审批 | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-BACKEND-SERVICE | API 进程 | MUTATE | CURRENT_OFFICIAL_LIVE |
| AUTH-DB-MIGRATION | git+deploy SQL | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-DB-RUNTIME-WRITER | db_pool 行写 | MUTATE | CURRENT_OFFICIAL_LIVE |
| AUTH-CMS-PUBLISH | CMS publish | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-OCS-PUBLISH | official.publish | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-INDEXER-READONLY | Indexer | **READ** | CURRENT_OFFICIAL_LIVE |
| AUTH-SAFE-TIMELOCK-ADMIN | Safe 0x96491 | ADMIN | CURRENT_OFFICIAL_LIVE |
| AUTH-GOVERNOR-PROPOSE | Governor 0xD5819ac · LEGACY 0x46Ce671 | GOVERN | CURRENT_OFFICIAL_LIVE |
| AUTH-TIMELOCK-EXECUTE | execute after eta | EXECUTE | CURRENT_OFFICIAL_LIVE |
| AUTH-CONTRACT-OWNER-TIMELOCK | Timelock owner | GOVERN | CURRENT_OFFICIAL_LIVE |
| AUTH-FEE-PARAM | OLD FR buckets/BPS | GOVERN | CURRENT_OFFICIAL_LIVE |
| AUTH-PM-PROXY-UPGRADE | PM EIP-1967 | GOVERN | CURRENT_OFFICIAL_LIVE |
| AUTH-REGISTRY-FTB-LOCK | Owner git / FTB 锁 | **READ** | CURRENT_OFFICIAL_LIVE |
| AUTH-PROPOSAL-3-ORTHOGONAL | Proposal #3 P4Cap spend | GOVERN | **TARGET_NOT_LIVE** |
| AUTH-CI02-FR-CUTOVER | CI-02 NEW FR | EXECUTE | **SCHEDULED_WAITING_ETA** |
| AUTH-PM25-UPGRADE | PM $25 impl OLD proxy | EXECUTE | **LEGACY** |

生效层并集覆盖 **L3 / L5 / L6 / L7 / L8**。

---

## 2 · 禁止冒充 Official 的权限

| 误读 | 本包结论 |
|------|----------|
| 设计 83 Seat / Vault Claim | TARGET_NOT_LIVE（CI-01/CI-03 未部署） |
| 历史 AXIS-05「GOV-04 pending」 | STALE；Official sale = NEW PM 100_000；OLD `$25` LEGACY；www chrome 仍 1e18 |
| **Proposal #3** 能力 | LONG_WAIT 正交 · 不是当前 Official spend |
| Admin 改 FeeRouter / PM | RBAC 只到 L6；owner = Timelock |
| Indexer / CMS / DB migration 改链 | 禁止边 |
| CI-02 | SCHEDULED_WAITING_ETA · 独立梯子 · Official hop 仍 OLD FR |

---

## 3 · 跨 Pack

| Pack | 关系 |
|------|------|
| **03** | GP-01 session · GP-04 orders · GP-07 steward claim TARGET · GP-08 Governor queue |
| **04** | CMS 公告 PG · Indexer L8 ≠ L7 · onboarding entitlements |
| **05** | W3-GOVERNOR / TIMELOCK / SAFE / FR-OLD / PM-PROXY |
| **06** | S04 INTERIM 收款 ≠ 本包 owner；S05/S10 TARGET；S08 权限活、spend 环未闭 |

Pack **08** 身份认证链是独立后续波（本包 CLOSED 后另闸）。

---

## 4 · 本波不做

- 改 FTB、RBAC、Safe owners、Governor、Timelock、合约、Official Runtime  
- deploy / schedule / execute / cutover / 真钱  
- 执行 **CI-02** 或 PM **$25**  
- 翻转 `TT_PRODUCTION_GO`（保持 **NO_GO**）  
- 开工 **Pack 08**（本包不拥有；见 Pack 08 LATEST）
