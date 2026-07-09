# City Hero Runtime Contract · Review

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Contract** | v1.0.0 CONTRACT_ONLY |
| **Verdict** | **PASS** |
| **Next** | Wave 1 东京实现规划 |

## 核对维度

| # | 维度 | 结论 |
|---|------|------|
| asset_kind | asset_kind=city_hero | **PASS** |
| city_slug_query | city_slug 查询 | **PASS** |
| fallback_chain | Fallback 链 | **PASS** |
| consumer_mapping | Home / Travel Consumer | **PASS** |
| verify_probes | Verify 探针 | **PASS** |
| evidence_schema | Evidence Schema | **PASS** |
| wave1_tokyo | Wave 1 东京验收 | **PASS** |
| p1_exit_gate_mapping | P1 六门映射 | **PASS** |

## Staging 探针

| Probe | count |
|-------|-------|
| city_hero JP | 0 |
| city_hero JP+city_slug=tokyo | 0 |
| landing_ambient JP (fallback ②) | 1 |

## 预期差距（Contract 阶段正常）

- city_hero not in catalog_ops_admin allowlist
- MediaQuery lacks city_slug filter
- catalog count=0 for city_hero
- no resolver implementation

## 未修改

Registry · Ownership Matrix · P1 Standard · 无 Admin/API/Runtime/Frontend 实现
