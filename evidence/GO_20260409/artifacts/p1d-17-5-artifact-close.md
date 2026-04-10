# P1-D — 17 条 #5 Artifact（export_deployment_params）工程互证

**TT**：`TT-07-63B-P1D-17-5-ARTIFACT-001` · **登记日期**：2026-04-09；**`deployment_params_export.txt`** 内 **`exported_utc`** 为脚本生成时刻（UTC）。

**不替代**：目标链**真实部署地址**台账、**Slither** 全量报告、持牌审计签字；本卡仅闭合 **checklist-17 #5** 与仓库脚本的**可复现构建指纹**互证链。

---

## 1. Artifact 来源（`export_deployment_params`）

| 项 | 说明 |
|----|------|
| **脚本** | 项目根 **`./scripts/export_deployment_params.sh`**（bash）或 **`.\scripts\export_deployment_params.ps1`**（PowerShell；**UTF-8 无 BOM** 写文件） |
| **推荐产出命令** | `bash scripts/export_deployment_params.sh evidence/GO_20260409/artifacts/deployment_params_export.txt`（路径可改为当次 **`GO_YYYYMMDD`** 目录下任意文件名） |
| **无参数** | 脚本将快照打印到 **stdout**（不落盘）；发版留痕须带**输出路径**参数 |

### 1.1 输出路径（本 bundle 登记）

| 文件 | 路径（相对 `evidence/GO_20260409/`） |
|------|--------------------------------------|
| 构建/指纹快照（主 artifact） | **`artifacts/deployment_params_export.txt`** |
| 主 artifact 的 SHA-256（sidecar） | **`artifacts/deployment_params_export.sha256`** |

### 1.2 文件结构与内容类型

**类型**：UTF-8 文本（`key: value` / 节标题 `=== section ===`），**不是** JSON；与仓库脚本实现一致。

**结构块**：

1. **`=== meta ===`**  
   - **`exported_utc`**：UTC 时间戳  
   - **`repo_root`**：执行时仓库根绝对路径  
   - **`git_commit`**：当前 `HEAD` commit（或 `n/a`）

2. **`=== contracts / forge ===`**  
   - **`forge_version`**：`forge --version` 多行（若 `forge` 在 `PATH`）  
   - **`forge build`**：在 **`contracts/`** 执行（成功则继续）  
   - **`bytecode_chars_<Contract>`**：对 **Escrow、EscrowFactory、Staking、Registry、FeeRouter、MockERC20** 执行 `forge inspect <C> bytecode` 后测得的**字符长度**（指纹用途；**非**完整 bytecode 落盘）  
   - 若 **无 forge**：单行说明须安装 Foundry 后重跑

3. **`=== optional slither ===`**  
   - 提示：`cd contracts && slither . --json slither-report.json`，可按 checklist 另附 **`slither-report.json`**

**内容语义**：与 **17 条 #5**（participants / 部署与合约构建可追溯）配套的**工程侧**「当时仓库 + 编译产物体量」快照；**链 ID、部署地址、构造参数**仍以 **`Deploy.s.sol` / 运维台账** 为 SSOT，本脚本**不**替代。

---

## 2. Hash / 指纹与校验

### 2.1 主文件指纹

- **算法**：SHA-256（256-bit，小写十六进制）  
- **Sidecar**：`deployment_params_export.sha256` 为 **`sha256sum`** 标准行：  
  `<64_hex> *artifacts/deployment_params_export.txt`  
  （`*` 后路径相对于执行 `sha256sum -c` 时的当前目录；本仓库建议在 **`evidence/GO_20260409/`** 下执行校验，见下）

### 2.2 如何计算（再生）

```bash
# 项目根：重新生成（会覆盖目标文件）
bash scripts/export_deployment_params.sh evidence/GO_20260409/artifacts/deployment_params_export.txt
sha256sum evidence/GO_20260409/artifacts/deployment_params_export.txt > evidence/GO_20260409/artifacts/deployment_params_export.sha256
```

**PowerShell**（项目根）：

```powershell
.\scripts\export_deployment_params.ps1 evidence\GO_20260409\artifacts\deployment_params_export.txt
# 再于 Git Bash / WSL 对同一文件跑 sha256sum，或 Get-FileHash -Algorithm SHA256
```

### 2.3 如何校验

```bash
cd evidence/GO_20260409
sha256sum -c artifacts/deployment_params_export.sha256
```

期望：**`artifacts/deployment_params_export.txt: OK`**

**说明**：再生后 **`git_commit` / `exported_utc` / bytecode 长度** 可能变化，hash **会变**；发版日以**当次** `manifest.json` 登记的 **`sha256`** 为准，与 **`manifest.sha256`** 一并归档。

---

## 3. checklist-17 #5 ↔ deployment artifact ↔ GO_* ↔ 缺口官方总表

```
checklist-17.md  #5 行 + 发版前定稿表「#5」
        ↕  （脚本路径 / Slither 可选 / Runbook §12.8）
artifacts/deployment_params_export.txt + .sha256
        ↕  （本说明 + manifest 登记）
evidence/GO_20260409/manifest.json artifacts[] + manifest.sha256
        ↕
docs/spec/缺口与待补-官方总表.md  P1-D「17 条 #5 Artifact」☑
        ↕
docs/spec/15-多维度文档与技术检查报告.md 附录〇 第 14 项 / 机器预检留痕段
```

- **[checklist-17.md](../../../scripts/checklist-17.md)**：**#5** 要求 deployment_params 或 Slither；**定稿表 #5** 指向本脚本与 **Runbook §12.8**。  
- **本目录**：`p1d-17-5-artifact-close.md`（本文件）+ `deployment_params_export.txt` + `deployment_params_export.sha256` 已登记入 **`manifest.json`** **`artifacts[]`**（含各自 **`sha256`**）。  
- **[缺口官方总表](../../../docs/spec/缺口与待补-官方总表.md)**：**P1-D** 行勾选互证本 **TT**。  
- **[15 附录〇](../../../docs/spec/15-多维度文档与技术检查报告.md)**：**第 14 项**（01 §10 / 17 条）与「机器预检留痕」段并联本 **GO_20260409** bundle。

---

## 4. 机读自检

- `bash scripts/check-governance-doc-linkage.sh`（文档互链）  
- `cd evidence/GO_20260409 && sha256sum -c manifest.sha256`（校验 **`manifest.json`** 本体）  
- `cd evidence/GO_20260409 && sha256sum -c artifacts/deployment_params_export.sha256`（校验 **deployment** 快照文件）
