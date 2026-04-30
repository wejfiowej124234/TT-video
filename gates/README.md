# Gates (SSOT)

- **`production_gate.yaml`** — 生产门禁机器可读清单；与 `.github/workflows/production-gate.yml` 必须一致。校验：`python3 scripts/gates/verify_production_gate_config.py`
- **`tier_a_ci/`** — 满足 96-15 Tier A1/A2 最小字节的 **PR 机跑** 证据（**不**等于生产人签 bundle）。
- **`waivers/`** — 可选 **`96-15.waiver.json`** 豁免 Tier 96-15；见 `waivers/README.md`。
