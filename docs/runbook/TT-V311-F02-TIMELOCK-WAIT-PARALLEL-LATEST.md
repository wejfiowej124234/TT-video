# TT · F-02 Timelock Wait · 48h Parallel Work Pack

**Canonical ladder:** [`TT-TRAVELTRUST-RELEASE-ENGINEERING-LADDER-LATEST.md`](./TT-TRAVELTRUST-RELEASE-ENGINEERING-LADDER-LATEST.md) · `20260718-enterprise-final`  
**V311 instance:** [`TT-V311-FINAL-RELEASE-ENGINEERING-LATEST.md`](./TT-V311-FINAL-RELEASE-ENGINEERING-LATEST.md)  
**F-02:** proposal `#1` Queued · Execute ETA **2026-07-20T11:37:37Z** · chain `11155111`  
**Evidence:** `evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/F-02-gov-timelock.json`  
**Parallel board:** [`TIMELOCK-PARALLEL-BOARD-LATEST.md`](../../evidence/GO_phase2_v311_final_release/TIMELOCK-PARALLEL-BOARD-LATEST.md) · Closure Audit itemized refresh under same dir

---

## 0 · 纪律（写死）

1. **Execute 前冻结：** 不再改协议 / ACTIVE / Runtime / Registry / Package LOCK  
2. RC LOCK = Phase 8 · 锁 **Release Package**  
3. Freeze 前必经 **P10.5** `TT_PRODUCTION_READINESS_REVIEW`（非重测）  
4. **P4 禁止回头不重验**  
5. 旧 RC-02 窗 = 非绑定浸泡  

**当前：** `FROZEN_WAITING_EXECUTE` · ETA **2026-07-20T11:37:37Z** · Board [`TIMELOCK-PARALLEL-BOARD-LATEST.md`](../../evidence/GO_phase2_v311_final_release/TIMELOCK-PARALLEL-BOARD-LATEST.md)

Execute 后**立即**短链：

```text
F-02 Execute
  → Function / Product / UI Full（54/0/0 口径收口）
  → 关闭全部 OPEN
  → Phase 8 RC LOCK
  → Phase 9 RC-02 24h（新开）
  → Phase 10 Manual
  → Phase 10.5 Production Readiness Review
  → TT_PSG_SEPOLIA_FREEZE
  → Production GO
```

---

## 1 · 48h 并行白名单

| 优先 | Phase | 工作 |
|------|-------|------|
| 0 | **Drift** | **Full-System Drift Audit**（Protocol/Runtime/Registry/CMS/Catalog/OCS/Search/API/Docs/Package 同 ACTIVE）· [`TT-V311-FULL-SYSTEM-DRIFT-AUDIT-LATEST`](./TT-V311-FULL-SYSTEM-DRIFT-AUDIT-LATEST.md) |
| 1 | −1 / 0 | Closure OPEN · Hygiene |
| 2 | 0.5 / 1 / 2 | Config Baseline · Alignment · Deploy Cert |
| 3 | **2.5** | **Data Cert**（CMS/OCS/Catalog/Provider/Guide/Media/i18n/Projection）→ `TT_DATA_CERT` |
| 4 | 5 / 6 | UI/UX Full · Product 聚合 |
| 5 | 6.5 / 7 / 7.5 | Ops Cert · Docs/Evidence · Package 准备 |

```bash
python scripts/dev/run-v311-full-system-drift-audit.py   # Timelock 只读；Execute 后复跑
```

### 建议命令（无广播）

```bash
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/smoke-wallet-connection-l5-local.sh
bash scripts/dev/run-v311-web3-full-function-cert.sh
```

---

## 2 · 窗内硬禁

- 合约 / 协议 / ACTIVE 矩阵 / Runtime / Registry ACTIVE 切轨  
- 宣称 Function / Data / Product / Ops / Package / RC / Freeze / GO  
- 借 P0.5 重开 Configuration Sprint  

---

## 3 · Execute 复跑

```bash
TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 \
  python - <<'PY'
import json, sys
sys.path.insert(0, "scripts/dev/lib")
from run_v311_function_cert_tier_c import run_f02_gov_timelock
print(json.dumps(run_f02_gov_timelock(), indent=2))
PY

TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 \
  bash scripts/dev/run-v311-web3-full-function-cert.sh
```
## Monitor heartbeat (auto)

**Latest:** `2026-07-19T09:12:34Z` · state=`5` `Queued` · ETA `2026-07-20T11:37:37Z` · seconds_until=`95102` · phase=`FROZEN_WAITING_EXECUTE`

Evidence: `evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.md`

**Post-Execute ladder (no skip):**

```text
F02_Execute_success → Function_Cert_54_0_0 → Product_Cert_PASS → UI_Full_Cert_PASS → Governance_RC_CLOSED → Money_Path_OPT_A_TRE02 → Money_Path_OPT_A_REG01 → Money_Path_OPT_A_REG04 → V_UNIT → V_SEPOLIA → V_REAUDIT_M_RC_04 → Constitution_Audit_PASS → Full_Consistency_Matrix_rerun
```

`TT_WEB3_FULL_CONSTITUTION_CONSISTENCY=PASS` forbidden until full ladder + zeros.
