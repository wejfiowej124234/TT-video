# Registry（机读登记草稿）

本目录存放**仅登记、不执行迁移**的机读草稿，与 **`docs/spec-path-dependency-migration-inventory.md`** 同源政策：**不删除、不搬迁 `docs/spec/`**。

**变更纪律（与盘点文、CONTRIBUTING、AGENTS、`.cursor/rules` 同源）**：凡是**新增、删除或改动** **`docs/spec` 路径依赖**，**须同步**更新 **`docs/spec-path-dependency-migration-inventory.md`** 与 **`registry/spec-path-dependencies.v1.yaml`**，并运行 **`python registry/validate-spec-path-dependencies-registry.py`**（**exit 0**）。**不**借此迁移或删除 **`docs/spec`**，**除非单独立项**；**不**改 **`build.yml`** 主链默认必过。

| 文件 | 说明 |
|------|------|
| **`spec-path-dependencies.v1.yaml`** | `docs/spec` 路径依赖登记：`classification` **A**=法定壳留 spec · **B**=可迁机读衍生 · **C**=handbook/corpus 导读；含 `consumers`、`target_location`、`migration_prerequisites` |
| **`validate-spec-path-dependencies-registry.py`** | 轻量结构校验（YAML 可解析、`classification` 枚举、`target_location` / `migration_prerequisites` 必填、consumer 路径形状与**可解析存在性**）；**不**迁移、**不**删 spec、**默认不**接入 CI |

**本地校验（仓库根）**

依赖：**PyYAML**（与现有 `yaml.safe_load` 脚本相同环境）。

```bash
python registry/validate-spec-path-dependencies-registry.py
```

显式路径：

```bash
python registry/validate-spec-path-dependencies-registry.py registry/spec-path-dependencies.v1.yaml
```

失败时 **stderr** 前缀 **`REGISTRY-STRUCT:`**，**exit 1**；通过打印一行 **`OK:`** 并 **exit 0**。

**GitHub Actions（低频 · 非 build 主链）**

- Workflow：**`.github/workflows/registry-spec-path-dependencies-validate.yml`**（**`Registry spec-path dependencies validate`**）。
- 触发：**`workflow_dispatch`**；**`pull_request` / `push`（`main`）** 且 **paths** 命中 **`docs/spec-path-dependency-migration-inventory.md`**、**`registry/spec-path-dependencies*.yaml`**、**`registry/validate-spec-path-dependencies-registry.py`**、**`scripts/gates/check-ci-exemption.sh`**、**本 workflow 文件** 之一时（低频；与 **build** 主链正交）。
- 与 **`build.yml`** 正交；不改变默认 **Build** PR 必过组合（除非仓库另行勾选本 workflow）。

**字段约定（v1 草稿）**

- **`classification`**：`A` | `B` | `C`（见盘点文档 §1）。
- **`spec_path`**：仓库相对路径；`**` 表示 glob；`prefix:` 表示子树；与 **`primary_spec_paths`** / **`spec_path: null`** 元条目不互斥（见 YAML 内示例）。
- **`consumers`**：`scripts` / `workflows` / `docs_areas` 为字符串列表（路径相对仓库根）。**`docs_areas`** 也可与 **`consumers`** 同级挂在条目中（用于 glob 文档范围）；校验脚本会一并校验。
- **`target_location`**：未来机读落点或 `keep:docs/spec/...` 表示法定壳不迁正文。
- **`migration_prerequisites`**：迁移或改消费方前须满足的条件（含 **P-C**、双跑、08/98 等）；无则写 **`[]`**。

维护：新增硬编码 `docs/spec` 的脚本或 workflow 时，**同步**更新 `spec-path-dependencies.v1.yaml` 对应条或增条。
