# Production Readiness · Priority Ladder

**Machine SSOT：** [`registry/production-readiness-priority-ladder.v1.json`](../../registry/production-readiness-priority-ladder.v1.json)  
**Master Matrix：** [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml) · `priority_ladder`  
**Platform Coverage：** [`TT-PLATFORM-CAPABILITY-REGISTRY.md`](TT-PLATFORM-CAPABILITY-REGISTRY.md)

---

## 总阶梯（写死）

**下一阶段唯一目标：** **Platform Adoption 100%**（不是「新增 XXX 架构」）

```text
P0   Runtime Blocking          ← 唯一运行态阻塞
  ↓
P1-A Verification Completion   ← 重新验证（不是修代码）
P1-B Platform Coverage         ← 全仓 Adoption：RuntimeIdentity 95→100 · ConfigurationTruth 90→100
P1-C Repository Hygiene        ← commit / registry / matrix / evidence
  ↓
P2   Platform Adoption          ← TT_PLATFORM_ADOPTION 总指标 → 100%
  ↓
P3   Release Execution          ← Formal → Gate PASS 序列
  ↓
     Production GO
```

**Release Train 插入点：** Reality Fix → **Platform Coverage Audit** → Reality Verification → Formal

**Release 前先看 Coverage Audit，不要 grep。**

```bash
bash scripts/dev/run-platform-coverage-audit.sh
```

---

## P0 · Runtime Blocking（唯一真正 Blocker）

| 项 | 值 |
|----|-----|
| **Gap** | `PRM-SEC-B002` |
| **本质** | **Production Runtime Identity 未建立** — **不是 Security** |
| **链** | Registry → Configuration → Fly → Runtime → `/meta` → Identity **全部一致** |
| **现状** | `deployment_profile = null` → `TT_CONFIGURATION_TRUTH: FAIL` |
| **解除** | `bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only` → 六真源 G2 重验 |

**未解决 P0 → 禁止 G2 Formal。**

---

## P1-A · Verification Completion

**性质：** 重新验证 · **不是**修产品代码。

| 待办 | Machine key |
|------|-------------|
| 六真源 G2 Verification 重跑 | `TT_G2_REALITY_VERIFICATION` |
| G1 Verification | `TT_G1_REALITY_VERIFICATION` |
| SEC-B001 / PER-B001 / MON-B001 六真源下复核 | Matrix CLOSED → 需 VERIFIED |
| MON Resolve 机读证据（可选） | — |

```bash
bash scripts/dev/run-reality-verification.sh --gate G2
```

---

## P1-B · Platform Coverage

**性质：** 平台能力全仓覆盖率 · **不是**产品 Bug。

| Capability | 看 Audit 表 | 典型未迁移 |
|------------|-------------|------------|
| RuntimeIdentity | coverage % | Stripe · Monitoring · PER · Community Admin |
| ConfigurationTruth | coverage % | GitHub Actions · CFG drift |

**总指标：** `TT_PLATFORM_ADOPTION`（见 Audit 输出）

---

## P1-C · Repository Hygiene

**性质：** 仓库治理。

- Commit 基础设施 + evidence
- Matrix `go_gates` vs gaps 漂移修正
- SSOT 双轨合并（identity registry）
- 证据 stamp 入库

---

## P2 · Platform Adoption

**最终要求：** **100% · 0 未迁移模块** — 不是 95%。

```bash
bash scripts/dev/run-platform-coverage-audit.sh
node scripts/dev/validate-platform-coverage-gate.cjs --inline --gate G2
```

---

## 平台架构冻结（2026-07-04 · 写死）

**禁止新增：** Registry · Guard · Verification Layer · Truth Source · Capability  
**除非：** Architecture Review **Approve**

平台层已足够成熟 — 剩余是 **Adoption + P0 Runtime Identity**，不是新架构。

---

## P3 · Release Execution

**性质：** 发布执行 — **P0 清空后**才进入。

```text
G2 Formal Acceptance
  → TT_PRODUCTION_READINESS_G2_GATE PASS
  → G3 Verification
  → TT_PRODUCTION_READINESS_G3_GATE PASS
  → Production GO
```

---

## 诚实边界

- **P0 ① 探针** ≠ **② staging GO** ≠ **③ Production GO**
- **P1-B / P2 低覆盖率** 不单独阻塞 Formal，但 **P0 必阻塞**
- **Matrix gaps CLOSED** ≠ **Verification VERIFIED**（P1-A）
