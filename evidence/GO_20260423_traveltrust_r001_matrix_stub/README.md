# GO_20260423_traveltrust_r001_matrix_stub

**Purpose:** provide a **repo-relative**, **R-001-valid** `report.json` so **`scripts/validate-regression-report.py`** can be run in CI or locally without claiming a staging **full 93** run.

**Validate:**

```bash
python scripts/validate-regression-report.py evidence/GO_20260423_traveltrust_r001_matrix_stub/report.json
```

**Honesty boundary:** **`release_gate`** is **`PARTIAL_GO`**; most matrix rows are **`NOT_RUN`** in this file. **D-IDX-001** is **`PASS`** only by **cross-reference** to **`matrix_93_d_idx_001_f029_*`** (see `D-IDX-001/notes.md`). **ISS-007** remains open for **full matrix** / **`build.yml` · `e2e`**.
