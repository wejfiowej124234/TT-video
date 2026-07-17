# TravelTrust · PSG Release Candidate Sequence

**STATUS:** `ACTIVE` · **v1.1.0**（含 R1 / R2）  
**Machine SSOT:** [`registry/psg-release-candidate-sequence.v1.yaml`](../../registry/psg-release-candidate-sequence.v1.yaml)  
**Solo workflow (default):** [TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md) · [`registry/psg-solo-developer-workflow.v1.yaml`](../../registry/psg-solo-developer-workflow.v1.yaml)  
**Foundation Gate:** [`registry/psg-foundation-gate-LATEST.v1.yaml`](../../registry/psg-foundation-gate-LATEST.v1.yaml) · `node scripts/dev/run-psg-foundation-gate.cjs`  
**Execution lock:** [`registry/psg-execution-control.v1.yaml`](../../registry/psg-execution-control.v1.yaml) · `node scripts/dev/psg-execution-lock.cjs status`  
**Freeze Manifest:** [`registry/psg-release-candidate-freeze-LATEST.v1.yaml`](../../registry/psg-release-candidate-freeze-LATEST.v1.yaml)  
**Parent (PGC):** [TT-PRODUCTION-GOVERNANCE-CLOSURE.md](./TT-PRODUCTION-GOVERNANCE-CLOSURE.md)  
**Machine key:** `TT_PSG_RELEASE_CANDIDATE_SEQUENCE`  
**Stamp:** `20260717`

---

## 0 · 一句话

**先冻基线，再认证能力；所有 Capability Cert 必须挂在同一个 Release Candidate 上。**  
本序列是证据链纪律，**不**替代 `TT_PSG_PRODUCTION_CERT=PASS`，**不**授予 Production GO。

**Solo Developer（写死）：** 步骤内的「Review」= **Owner Self Review / Owner Sign-off** 流程阶 · **≠** peer Code Review · **不要求** PR / Approver / 双人审批。Gate · Evidence · Freeze · Cert · Archive **不因 Solo 放宽**。

---

## 1 · 主轨（写死）

```text
1. Foundation Gate
        │
        ▼
2. Full Alignment Audit
        │
        ▼
2.5 Baseline Freeze（Release Candidate）
        │
        ▼
3. Capability Certification（PSG/PF 单轨）
        │
        ▼
4. Production Entry Review
        │
        ▼
   TT_PSG_PRODUCTION_CERT = PASS
        │
        ▼
5. Production GO（唯一出口）
```

| 步骤 | 内容 | Exit Criteria |
|------|------|----------------|
| **1** | Foundation Gate | **`foundation_gate.status = PASS`**（机读聚合 · R1） |
| **2** | Full Alignment Audit | Drift / Conflict / Blocking Risk = 0 |
| **2.5** | Baseline Freeze | **Freeze Manifest** 不可变落盘（R2） |
| **3** | Capability Certification | PSG/PF 按序认证；证据只引用 `freeze_manifest_id` |
| **4** | Production Entry Review | `TT_PSG_PRODUCTION_CERT = PASS` |
| **5** | Production GO | 唯一出口 |

---

## 1.1 · 长期规则 R1 / R2（不再改口）

### R1 · Foundation Gate 退出条件机读化

聚合状态（唯一判断位）：

```yaml
foundation_gate:
  status: PASS | FAIL
  checks:
    ssot_drift: PASS
    env_alignment: PASS
    repro: PASS
    runtime_b4: PASS
    data_foundation: PASS
```

- 机读真源：`registry/psg-foundation-gate-LATEST.v1.yaml`  
- 聚合器：`node scripts/dev/run-psg-foundation-gate.cjs`  
- **只读 `foundation_gate.status`**，禁止脚本各自拼读多个 gate 结果冒充退出  

### R3 · 执行控制（Preflight → Certify）

**SSOT:** [`registry/psg-execution-control.v1.yaml`](../../registry/psg-execution-control.v1.yaml) **v1.1.0** · **ACTIVE lease:** [`registry/psg-execution-lock-ACTIVE.v1.yaml`](../../registry/psg-execution-lock-ACTIVE.v1.yaml) · **CLI:** `node scripts/dev/psg-execution-lock.cjs`

```text
Preflight → Lock → Run → Observe → Diagnose → Fix → Rerun → Evidence → Registry → Certify
```

| 阶 | 含义 |
|----|------|
| **① Preflight** | 同类 Run？残留进程？环境锁？Staging 写占用？ |
| **② Lock** | 获取 `run_id` + environment lease |
| **③ Run** | 执行任务 |
| **④ Observe** | 断线 → **resume_existing_run**（禁止 start_new_run） |
| **⑤ Diagnose** | environment / permission / data / code / concurrency |
| **⑥ Fix** | 只修根因 |
| **⑦ Rerun** | **新 run_id** · 同一治理流程 · **不覆盖**旧 evidence |
| **⑧–⑩** | Evidence → Registry → Certify |

**三检（每次启动必做）：**

| 检 | 问题 |
|----|------|
| **Run Check** | 同类型任务是否已在跑？（Foundation / Alignment / Cap Cert · 同环境唯一） |
| **Environment Check** | Local 可写 · Staging 须 Lease · Production Owner-only |
| **Evidence Check** | FAIL 证据保留；Rerun 新 stamp（Run-001 FAIL + Run-002 PASS 并存） |

**写死原则：** 断线 ≠ 任务失败；任务 RUNNING ≠ 可以重新启动；**跑失败 ≠ 直接重跑**，须 Diagnose → Fix → 再跑。

```bash
node scripts/dev/psg-execution-lock.cjs preflight --pipeline foundation_gate --env staging
node scripts/dev/psg-execution-lock.cjs status
```

禁止：Connection failed 后再开一轮 Gate；多实例抢 Staging；`PSG_SKIP_BOOTSTRAP=1` 冒充收口；FAIL 后盲启第二个 Gate。

### R2 · Freeze Manifest

Freeze 时生成**一份**不可变 Manifest，字段至少包括：

| 字段 | 含义 |
|------|------|
| `freeze_manifest_id` | 本 Candidate 唯一 ID |
| `git_sha` | Git SHA |
| `registry_sha` | Registry 树指纹 |
| `migration_version` | Migration head |
| `config_fingerprint` | 配置指纹 |
| `cms_snapshot_id` | CMS / OCS snapshot |
| `runtime_build_id` | Runtime Build ID |

Capability Certification **只引用** `freeze_manifest_id`，禁止再拼装多源基线。

---

## 2 · 为什么必须有 2.5 Baseline Freeze

没有 Freeze 时常见回环：

```text
认证完成 → 修 Runtime → 修 CMS → 修 Migration → 重新认证
```

结果是：

- 004 用 SHA A  
- 007 用 SHA B  
- Production Cert 用 SHA C  

证据链**不属于**同一个 Release Candidate。

有 Freeze 后：

```text
Alignment PASS → Freeze Candidate（SHA/Migration/CMS/Config 固定）→ 全部 Capability Cert
```

全部证据属于同一 Candidate。

### Freeze 期间只允许

- **Blocking Defect**（使冻结基线失效）→ 解冻 → 回步 1/2 → **重新 Freeze** → 作废旧 SHA 上的 Cert 证据  

### Freeze 期间禁止

- 非阻塞重构  
- 改变公众面基线的 CMS bulk  
- 无 Blocking Defect 的 Migration  churn  
- 用另一 SHA 做 Capability Cert  

---

## 3 · 长期纪律（两条）

### 纪律一 · 不得越阶

**步骤 3 不得越过步骤 1 / 2 / 2.5。**  
违反 → 停止 Cert，退回 Foundation 或重新 Freeze。

### 纪律二 · 双轨汇合

| 轨 | 证明什么 |
|----|----------|
| **Module Release Ladder** | 某模块达到发布标准 |
| **PSG Production Cert** | **整个系统**达到发布准入标准 |

- 前者**不能**替代后者  
- 后者**不能**忽略前者  
- **Production Entry 前必须汇合**

---

## 4 · 当前指针（诚实）

以 registry `current:` 为准（本轮已闭周期）：

- **Baseline Tag:** `v1.1.0-psg-go.20260717` · **`TT_PRODUCTION_GO: GO`**  
- 本周期 Step 1–5 **已闭**；后续 Hotfix/Patch/Feature 走 [Solo Workflow](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md) · 从 Tag 开分支  
- **下一正式 Production GO** → **新** Freeze / 新 Archive · **禁止**扩展本 GO 包或重跑已 PASS Gate 刷新基线  

---

## 4.1 · Solo 与 Step 名称

| 步骤名 | Solo 含义 |
|--------|-----------|
| Production Entry Review | Owner 对照 Exit Criteria + Evidence · **Owner Sign-off** |
| PSG Review（上游） | Owner Self Review · 非外部 Reviewer |
| Capability Certification | 机读 Cert + Evidence · 非 Code Review |

---

## 5 · 与 PGC 的关系

PGC 短链：

```text
L0 → PSG → PF → Production Entry → Production GO
```

本文件把 **PSG → Production Entry** 展开为 **1 → 2 → 2.5 → 3 → 4**，并强制 **同一 RC 基线**。  
硬闸不变：Production Deploy / Bootstrap / GO 仍要求 **`TT_PSG_PRODUCTION_CERT=PASS`**。

---

## 6 · ①②③

① 本地 / ② Staging 上的 Foundation、Alignment、Freeze、Capability Cert **可以**推进；  
③ Production GO **仅**步 5，且不得用 ①② 绿冒充。
