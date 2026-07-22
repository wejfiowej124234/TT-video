# TT · Staging / Testnet · Multi-Dimension Old-Runtime Checklist（WAIT_ETA · READ-ONLY）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_STAGING_OLD_RUNTIME_MULTI_DIM_CHECKLIST`  
**Status:** `SUPERSEDED_SNAPSHOT` · `REPORT_ONLY` · `NO_DEPLOY` · `NO_CODE_CHANGE`  
**Recorded:** `2026-07-20`（live re-probe）  
**Pin / tip：** `PSG-REL-20260720-WEB3-CAND-V2` · `652bbab51a1eb0652ea31f18ae4146fbe325a1ea`  
**Staging API：** `https://tt-api-staging.fly.dev/meta` → `build.git_sha` = `f8181b63507fe339e23a1e5285c4242a8bb3507e`  
**Web：** `https://tt-web-staging.fly.dev/` → HTTP 200（无公开 git_sha）

```text
结论：测试网大量仍是旧运行态（OLD_RUNTIME）相对 tip
≠ 立刻 redeploy（等 Formal Baseline → W0）
≠ Auth/CMS 生产缺口都是「没部署」（多数是 TRUE_FEATURE_GAP）
≠ Production GO
```

**上游：** Discovery Freeze · Runtime Drift · Reality Consistency · Feature Inventory · DB Audit  
**下游：** **W0** 先 · 再 W1–W7

---

## 0 · 锚点对照（live）

| 锚 | 值 |
|----|-----|
| Local HEAD / Candidate Identity | `652bbab5…` |
| Staging `/meta` | `f8181b63…`（祖先 · **落后 4 commits**：`493596ae`→`09c72b93`→`1de17b6a`→`652bbab5`） |
| chain_id | `11155111`（Sepolia · OK） |
| EscrowFactoryV2 | Candidate `0x6e9a…bdef` · Staging **`null`** |
| SettlementRouter | Candidate `0x5A6d…4d6A` · Staging **无投影键** |
| FeeRouter | Candidate `0xf406…0ab28` · Staging `0x81A8…9306` **≠** |
| Timelock | **一致** `0x4624…504c` |
| Indexer checkpoint | **0 / 0** |
| dual_write | `log_only` |
| outbox.worker_enabled | **false** |
| database | `connected=true` · **无 migration hash 字段** |
| ssot.match | **false** · expected unset |
| treasury_address | **null** |

---

## 1 · 总清单（KNOWN + 本轮加深）

### A · 部署 / 镜像 / SHA（P0 · W0）

| ID | 项 | 状态 | 已有? |
|----|-----|------|:-----:|
| S-SHA-01 | API `/meta` ≠ tip（4 commits） | **旧** | ✅ |
| S-SHA-02 | Fly API 镜像龄（先前 v279 · 2026-07-19） | **旧** | ✅ |
| S-SHA-03 | Web staging 无公开 SHA · 更新日期偏旧 | **旧/不可见** | ✅ |
| S-SHA-04 | Worker 镜像版本 | **UNKNOWN**（未本轮探针） | — |
| S-SHA-05 | `build.deployed_at=null` 部署可追溯弱 | **弱** | ✅ 再确认 |

### B · 链上投影 / Money Path（P0 · W0）

| ID | 项 | 状态 | 已有? |
|----|-----|------|:-----:|
| S-CTR-01 | `escrow_factory_v2=null` | **旧** | ✅ |
| S-CTR-02 | SettlementRouter 缺失 | **旧** | ✅ |
| S-CTR-03 | FeeRouter 地址不一致 | **旧** | ✅ |
| S-CTR-04 | 仅旧 `escrow_factory` | **旧** | ✅ |
| S-CTR-05 | Timelock 一致 | OK | ✅ |
| S-CTR-06 | `treasury_address=null` | **缺口/未投影** | 🆕 强调 |
| S-IDX-01 | Indexer checkpoint 0 | **旧/未进** | ✅ |

### C · 配置 / 可靠性（P1 · W4；先 W0 再验）

| ID | 项 | 状态 | 已有? |
|----|-----|------|:-----:|
| S-CFG-01 | dual_write=`log_only` | 默认非生产严格 | ✅ |
| S-CFG-02 | outbox worker off | 默认关 | ✅ |
| S-CFG-03 | `ssot.match=false` / expected unset | Staging 未钉 SSOT 校验 | 🆕 强调 |
| S-CFG-04 | chargeback_policy unset（若 /meta 暴露） | 策略未钉 | 🆕 旁证 |
| S-CFG-05 | Stripe test keys / webhook | **/meta 不可见** → UNKNOWN | — |

### D · 数据库（P1 · W0 附录 attest → W4）

| ID | 项 | 状态 | 已有? |
|----|-----|------|:-----:|
| S-DB-01 | Staging schema vs tip migration checksum | **/meta 无字段 · 未证** | ✅ UNKNOWN |
| S-DB-02 | `auth_email_tokens` 等表存在 ≠ 接线 | 功能债 · 非纯旧镜像 | ✅ |
| S-DB-03 | orders/payments 双写与 tip 行为 | 依赖 SHA+配置 | ✅ |

### E · 功能面（注意：不全是「旧部署」）

| ID | 项 | 主因 | Wave | 已有? |
|----|-----|------|:----:|:-----:|
| S-AUTH-01 | OTP→log→verified · Reset stub | **TRUE_FEATURE_GAP**（tip 即如此） | W1 | ✅ |
| S-AUTH-02 | Staging 真邮件探针 | 未做 / 密钥不可见 | W1 | — |
| S-CMS-01 | Unsplash 静默 fallback | 假绿风险 | W2 | ✅ |
| S-CMS-02 | QA LATEST 键污染 | 数据/治理 | W2 | ✅ |
| S-CMS-03 | Staging Patch 001–007 仍 BLOCKED_FG15 | 代码待 W0 后部署 | Dual-track | ✅ |
| S-FEAT-01 | Escrow/Settlement/Payment Web3 烟测 | **OLD_RUNTIME 假绿** | W0→W5 | ✅ |
| S-FEAT-02 | Governance chain_ssot 关 · 探针细节 | Identity 滞后 | W0/W5 | 🆕 细节 |
| S-MKT-01 | Market/Order 链同步视图 | Indexer 0 → 旧/空 | W0 | ✅ |

### F · 文档 / 证据（P2 · W6 · 不删 Archive）

| ID | 项 | 状态 | 已有? |
|----|-----|------|:-----:|
| S-DOC-01 | DOC-VS-DEPLOY 仍易把 `09c72b93` 当 tip | 指针旧 | ✅ |
| S-DOC-02 | 若干 LATEST 仍 living `run-fg15-*` | 脚本漂移 | ✅ |
| S-DOC-03 | 大量 `09c72b93` / clean_baseline 提及（多数 ARCHIVE 语境） | 需分类 | ✅ |
| S-EVD-01 | 用旧 Staging 烟测证 tip Money Path | **禁止** | ✅ |
| S-EVD-02 | FG-15-A 证据被误读为 ACTIVE | 横幅/Hygiene | ✅ |

### G · 运维 / 探针（P2）

| ID | 项 | 状态 | 已有? |
|----|-----|------|:-----:|
| S-OPS-01 | Incident/Alert/Backup 产品闭环 | NOT_READY（功能债） | ✅ |
| S-FLY-01 | 本轮 Fly CLI status 可能 503 | 探针不稳 · 以 /meta 为准 | 🆕 |

---

## 2 · 计数

| 桶 | ≈ |
|----|--:|
| **KNOWN（先前已登记）** | ~28 |
| **本轮加深 / 新强调** | ~6（treasury null · ssot.match · chargeback · gov 细节 · Fly 503 · 映射刷新） |
| **仍 UNKNOWN** | Web 精确 image SHA · Worker · Staging migration checksum · Stripe 密钥态 · 全量 seed 对拍 |

---

## 3 · 怎么读这张表（防误判）

```text
① 旧 SHA / 旧合约投影 / Indexer 0
   → 必须 Formal Baseline 后 W0 Runtime Alignment
   → 等窗禁止 fly deploy「先修掉」

② Auth OTP / CMS fallback / Outbox off
   → 即使部署 tip 也未必 READY
   → W1/W2/W4 Feature + DB 轨

③ 文档里的 09c72b93 / FG-15-A
   → 多数是 ARCHIVE 叙述 · W6 Hygiene
   → 不等于 Staging 又多了一套「坏功能」

④ 任何基于当前 Staging 的「绿」
   → 不能证明 tip / Candidate Money Path
```

---

## 4 · 建议动作（仍等窗）

| 做 | 不做 |
|----|------|
| 保留本清单 · Maintain | ❌ Redeploy / 改 Registry |
| 满窗 W0 按本表 A+B 收 | ❌ 用 Staging 烟测冒充 tip 认证 |
| W1+ 按 E 类功能债 | ❌ 把 TRUE_FEATURE_GAP 全怪成「没更新测试网」 |

**诚实边界：** Staging 旧 ≠ 仓库 tip 旧；tip 新 ≠ Staging 已新；清单 ≠ 已修复。
