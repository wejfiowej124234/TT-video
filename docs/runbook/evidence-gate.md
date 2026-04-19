# Evidence Gate v1.1（IMP-EV-001）

机读 evidence bundle 门禁与 CI 契约；与 **[evidence/README.md](../../evidence/README.md)** manifest 必填字段、**`scripts/dev/validate_evidence_manifest.py`** 同源。

---

## 1. Gate 定义

| 项 | 说明 |
|----|------|
| **Gate 名** | **IMP-EV-001** = **`validate_evidence_manifest.py`** 对 **`evidence/GO_*`** 根目录的校验 |
| **实现** | **`scripts/dev/validate_evidence_manifest.py`**；薄入口 **`scripts/validate-evidence-manifest.sh`**（参数透传） |
| **Workflow** | **[`.github/workflows/evidence-manifest-validate.yml`](../../.github/workflows/evidence-manifest-validate.yml)**（workflow 名 **`Evidence manifest validate`**） |

---

## 2. Baseline（静态锚 · 唯一）

| 项 | 说明 |
|----|------|
| **唯一基线（frozen baseline）** | 仅 **`evidence/GO_20260409`** — 仓库内 **IMP-EV-001** 的**唯一**锚定 bundle，**不得**在常规 PR / push 中改内容（见 workflow「Frozen baseline」步）。 |
| **用途** | 每次 CI **必跑**强校验；**`manifest.json` / `manifest.sha256` / `artifacts/**`** 与登记 **sha256** 一致性的金标准。 |

**防漂移**：同一 PR 内不得修改基线路径相对 **PR base** 的任何内容；向 **`main`** 的 **push** 亦不得变更该路径相对 **父提交** 的内容。需替换基线时须走**单独变更治理**（新开 TT、临时调整分支保护或 workflow 等，**禁止**随手改目录糊弄门禁）。

---

## 3. 必选参数（新证据入仓 · 与合并门槛）

凡 **`evidence/<bundle>/manifest.json`** 所代表的 **bundle**（含新建 **`GO_YYYYMMDD`**、**`GO_RC_*`** 等目录），在**合并入 `main` 之前**须本地或 CI 通过：

```bash
python3 scripts/dev/validate_evidence_manifest.py validate evidence/<bundle> \
  --emit-summary --verify-artifact-files
```

- **`--emit-summary`**：向 **stdout** 输出**一行** JSON（契约见 §4）
- **`--verify-artifact-files`**：核对 **`artifacts[].path`** 存在且内容与登记 **sha256** 一致

**合并语义**：未满足上式（或 CI 等价脚本失败）的变更 **一律不得合并** 至 **`main`**（须 **required status check** 绿灯，见 §5）。

**CI 编排**：**[`scripts/gates/imp-ev-001-evidence-bundles.sh`](../../scripts/gates/imp-ev-001-evidence-bundles.sh)** 在每次 **PR / push** 上对 **唯一基线** **`evidence/GO_20260409`** **以及** `git diff` 所触及、且含 **`manifest.json`** 的 **`evidence/<subdir>/`**（排除 **`GO_YYYYMMDD_template`**、**`GO_placeholder`**）逐一执行上式并 **`jq`** 断言契约。

---

## 4. Summary 契约（`validate_summary.v1_1`）

**`--emit-summary`** 成功时 **stdout** 单行 JSON，**`schema`** 为 **`traveltrust.evidence_manifest.validate_summary.v1_1`**。CI **必须**用 **`jq`**（或等价）断言至少下列**契约字段**（与实现字段名一致）：

| 字段 | 类型 | 成功时约定 |
|------|------|------------|
| **`status`** | string | **`"GO"`**（校验通过） |
| **`artifact_count`** | number | **`manifest.json`** 中 **`artifacts[]`** 条数 |
| **`hash_verified`** | boolean | 使用 **`--verify-artifact-files`** 且逐文件哈希通过时为 **`true`** |
| **`missing_files`** | array | 成功路径下为 **`[]`**（缺文件会在输出 summary **之前**失败退出） |

另含 **`bundle_root`**、**`manifest_sidecar_hash_ok`**、**`total_bytes`** 等，供观测与排障；**消费方**应以 **`status` + 上表三字段** 作为自动化门禁结论，**不得**仅把 JSON 当普通日志忽略。

**失败路径**：校验失败时进程**非 0** 退出，**通常无** summary JSON（stderr 为错误信息）。故 **「有效契约」= 退出码 0 且 stdout JSON 通过 jq 断言**。

---

## 5. CI 合约：Required Status Check（合并阻断）

**`Evidence manifest validate / IMP-EV-001 validate + JSON summary`** = **`REQUIRED STATUS CHECK`**：必须在 GitHub **branch protection** 中针对 **`main`** 勾选为**必过**，与 **Build** 等并列。

- **名称**：以 Actions UI 中的 **job 全名**为准
- **语义**：该 check **非绿灯 = 禁止合并**（**无**「仅警告」「可绕过」）；与文档口号一致，**工程上**也必须依赖该门闩，否则「唯一基线 + 新证据强校验」可被合并策略架空

---

## 6. 失败情形（排障）

| 情形 | 典型原因 |
|------|----------|
| 缺 **`manifest.json`** 或必填键 | 未按 evidence/README 填 **`gate`/`date`/`artifacts`/`sign_off`** |
| **`manifest.sha256`** 与 **`manifest.json`** 字节不一致 | 改 manifest 后未重算侧车 |
| **artifact 路径不存在** | 只提交 manifest、未提交对应 **`artifacts/**`** 文件 |
| **hash mismatch** | 文件已改但未更新 **`artifacts[].sha256`** |
| **baseline 不可变步失败** | PR/push 试图修改 **`evidence/GO_20260409`** |
| **summary 契约步失败** | stdout 非预期 JSON 或 **`status` ≠ `GO`** 等 |
| **diff 触及的 bundle 校验失败** | 该 **`evidence/<bundle>/`** 下 **`manifest` / 侧车 / artifacts** 未与 **`--verify-artifact-files`** 对齐（**禁止合并**直至修复） |

---

## 7. 禁止行为

- **修改** **`evidence/GO_20260409`**（baseline）以「绕过」或弱化门禁，除非经显式变更治理（见 §2）
- **跳过** **`validate`** 或关闭 **required check** 后合并应受门禁约束的变更
- **只提交** **`manifest.json`**（或改 hash）**不提交**对应 **artifacts** 文件

---

## 8. P1（后续）：跨 bundle 一致性

可选增强（**未**作为当前 CI 硬门槛）：

- **`validate_evidence_manifest.py compare <DIR_A> <DIR_B>`**：对比目录结构 / schema / 关键键（例如 **`artifacts`** 命名约定）
- 新 **`GO_YYYYMMDD`** 与 baseline 的「结构兼容」断言

详见 **[scripts/README.md](../../scripts/README.md)** **§二 CI 门禁**、**[CONTRIBUTING.md](../../CONTRIBUTING.md)** Gate-5 段。
