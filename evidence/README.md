# Evidence 目录（Gate 通过证据 bundle）

本目录存放 **Gate 通过** 与 **演练** 的取证级证据 bundle，与 [08-1-战略与合规风险检查清单](../docs/spec/08-1-战略与合规风险检查清单.md)、[08-2-附录-闭合工单表](../docs/spec/08-2-附录-闭合工单表.md) 配套。08 定稿与闭合标准见 [08-4](../docs/spec/08-4-对外口径包.md)、[08-3](../docs/spec/08-3-参数与门禁表.md) 开篇「审计闭合标准」及 [08-2 定稿前检查](../docs/spec/08-2-附录-闭合工单表.md)。

## 目录约定

- **evidence/GO_YYYYMMDD/** — 某次 Gate 通过（或发版前五门全过）的 evidence bundle。
  - 内含：`manifest.json`（产物清单）、`manifest.sha256`（校验）、截图/日志索引等。
  - 工单表 **Evidence** 列可贴：`evidence/GO_20250220/` 或 manifest 的 hash。
- **evidence/GO_YYYYMMDD_template/** — **可复制模板**：首次过门时复制为本目录并重命名为 GO_YYYYMMDD，再填写 manifest。勿在此目录内放真实证据。
- **evidence/GO_placeholder/** — **仅占位说明**（非 bundle、非模板）：说明真实 bundle 用 GO_YYYYMMDD 目录。
- **evidence/DR-YYYYQX-0N/** — 单次演练（Runbook 演练）产物，可选按演练编号建子目录。

**首次过门时**：① 复制 **evidence/GO_YYYYMMDD_template/** 为 `evidence/GO_YYYYMMDD/`（如 GO_20250220）② 在新区目录内编辑 `manifest.json`（填 gate、date、artifacts、sign_off）③ 生成 `manifest.sha256`（见模板内 README.txt，可用 `sha256sum manifest.json > manifest.sha256` 或等价命令）④ 在 08-2 对应工单 Evidence 列填写该路径或 manifest hash。无 bundle 时 Gate 不视为闭合。（注：原 scripts/p13_evidence_bundle.sh 已移除，按上述手工步骤即可。）

## manifest 格式与必填字段（SSOT）

**必填字段**（缺一则该 bundle 不得作为门禁证据）：

| 字段 | 类型 | 说明 |
|------|------|------|
| gate | string | 如 Gate-1～Gate-5；须与 08-2 Gate 汇总一致 |
| date | string | YYYY-MM-DD，过门或发版日期 |
| artifacts | array | 至少 1 项；每项含 path、sha256（小写 hex） |
| sign_off | array | 至少 1 人；角色或代号 |

**示例**：

```json
{
  "gate": "Gate-1",
  "date": "2025-02-20",
  "artifacts": [
    { "path": "SSOT-PARAMS-v1.pdf", "sha256": "..." },
    { "path": "PDP-ch1-8-signed.pdf", "sha256": "..." }
  ],
  "sign_off": [ "法务", "运维" ]
}
```

生成后计算 `sha256 manifest.json`（或 `sha256sum manifest.json`）写入 `manifest.sha256`，便于验证未被篡改。

**校验**：定稿或过门时建议对 manifest 做一次校验（必填字段存在、date 格式、artifacts[].sha256 为 64 位 hex）。有 jq 时可手工写校验命令；无 jq 时人工按上表核对，落 08-2 定稿前检查。（注：原 scripts/validate-evidence-manifest.sh 已移除。）

**可验证发布（08-4 第 7 章、W-Q6-FE、51-D3）**：前端构建完成后，按以下手工步骤生成 manifest.json 与 manifest.sha256，纳入 evidence：

### 可验证发布：手工生成 Manifest 步骤

当需要对发布的前端产物生成可验证的 manifest（如发版到生产环境前）：

**第一步：构建前端产物**
```bash
cd frontend
npm run build
```
构建完成后，产物位于 `frontend/.next/` 目录（Next.js 默认输出）。

**第二步：生成产物清单（manifest.json）**

在 `evidence/GO_YYYYMMDD/` 目录（进度标记为 YYYY-MM-DD）中创建 `manifest.json`，包含以下必填字段：

```json
{
  "gate": "Gate-5",
  "date": "2025-03-06",
  "artifacts": [
    { "path": ".next/static/chunks/main.js", "sha256": "abc123..." },
    { "path": ".next/static/chunks/pages/index.js", "sha256": "def456..." },
    { "path": "package.json", "sha256": "ghj789..." },
    { "path": "next.config.js", "sha256": "klm012..." }
  ],
  "sign_off": [ "DevOps Lead", "QA Lead" ]
}
```

**字段说明**：
- `gate`：通过的门（如 Gate-5 前端可替代）；必须与 08-2 工单 Gate 列一致
- `date`：发布或过门日期，格式 YYYY-MM-DD
- `artifacts`：产物列表，每项须包含 `path`（相对于 frontend/ 或仓库根的路径）和 `sha256`（小写 16 进制，64 位）
- `sign_off`：签字人，至少 1 人（角色名或代号）

**第三步：计算产物的 SHA256 hash**

若产物数量较少，可手工计算；若产物众多（>10 个），建议用脚本：

**方案 A - 手工（≤10 个产物）**：
```bash
# 计算单个文件 sha256
cd frontend
sha256sum .next/static/chunks/main.js
# 输出示例：abc123def456... .next/static/chunks/main.js
# 取前 64 位 16 进制数填入 manifest.json 的 sha256 字段
```

**方案 B - 脚本化（产物众多）**：
```bash
# 在 evidence/GO_YYYYMMDD/ 目录下（与 manifest.json 同级）
cd frontend
find .next -type f \( -name "*.js" -o -name "*.css" -o -name "*.json" \) | while read file; do
  hash=$(sha256sum "$file" | awk '{print $1}')
  echo "\"path\": \"$file\", \"sha256\": \"$hash\""
done > /tmp/artifacts.txt
# 手工将 /tmp/artifacts.txt 的内容填入 manifest.json 的 artifacts 数组
```

**第四步：生成 manifest.json 的校验哈希**

当 manifest.json 完全填实后：

```bash
cd evidence/GO_YYYYMMDD/
sha256sum manifest.json > manifest.sha256
# 输出：abc123...（64 位 hex）  manifest.json
```

此后 `manifest.sha256` 内容为单行，即 manifest.json 文件本身的 sha256 哈希，用于防止 manifest.json 被篡改。

**第五步：验证完整性（可选）**

过门或收付证据前，可验证：
```bash
# 验证 manifest.json 未被篡改
sha256sum -c manifest.sha256
# 输出：manifest.json: OK （说明 manifest.json 内容与哈希一致）

# 验证 artifacts 中单个产物的 hash（抽查）
cd ../../frontend
sha256sum .next/static/chunks/main.js
# 对比 manifest.json 中对应 artifact 的 sha256 值
```

### 示例流程

```bash
# 1. 构建前端
cd /path/to/Wbe3-TravelTrust
cd frontend && npm run build

# 2. 创建 evidence 目录（按日期）
mkdir -p ../evidence/GO_20250306

# 3. 编写 manifest.json（手工或脚本生成 artifacts 列表）
cat > ../evidence/GO_20250306/manifest.json << 'EOF'
{
  "gate": "Gate-5",
  "date": "2025-03-06",
  "artifacts": [
    { "path": "frontend/.next/static/chunks/pages/_app.js", "sha256": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" },
    { "path": "frontend/package.json", "sha256": "5ce0a6ba5e58e1da8b7c0e6d1c0f0a0c5a0e0a0c0f0a0c0e0a0c0f0a0c0e0a" }
  ],
  "sign_off": [ "DevOps Lead" ]
}
EOF

# 4. 生成 manifest.sha256
cd ../evidence/GO_20250306
sha256sum manifest.json > manifest.sha256
cat manifest.sha256
# 输出示例：e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  manifest.json

# 5. 在 08-2 工单 Evidence 列填写
# evidence/GO_20250306/manifest.json 或其 sha256：e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### 注意事项

- **产物路径一致性**：manifest.json 中的 `path` 应与实际文件位置相对应（可相对于仓库根或 frontend 目录）；定稿后不可改路径，否则校验失败。
- **SHA256 格式**：务必使用小写 16 进制（awk '{print tolower($1)}'），否则校验失败。
- **工单对应**：每个 Gate 的 manifest 应与 08-2 对应工单的 Evidence 列一一对应；缺失或路径错误参与不过门。
- **无 CI 自动化**：当前无自动脚本生成 manifest；完全手工执行。发版时可由 DevOps 或 QA 按上述流程执行一次，产物提交至 evidence 目录，工单 Evidence 列贴链接即可。

**Gate 通过检查**（满足后该 bundle 方可作为门禁证据；过门时逐项勾选）：□ manifest 含 `gate`、`date`、`artifacts`、`sign_off` □ 08-4 已定稿时，manifest 内引用版本号与 08-4 文末版本一致 □ 工单 Evidence 列已贴本目录路径或 manifest hash。与 00 发版前快速核对、08-2 定稿前检查配套使用。

*勿提交敏感内容（密钥、未脱敏 PII）；仅路径与 hash、脱敏清单可入仓。*

**发版时**：每 Gate 的 08-2 Evidence 列须填 **evidence/GO_YYYYMMDD/** 或 manifest.sha256；当前占位示例见 [50-阶段 §六附 50-P14 人工项填选一览](../docs/spec/50-阶段-后续优化与开发清单.md)。

**缺口说明**：真实 `evidence/GO_YYYYMMDD/` bundle 须在过门时按上文「首次过门时」四步产出并入仓；仓内不代造真实证据。除该人工步骤外，无其他可于仓内补齐的 evidence 缺口。

**未完成部分闭环标准**：当每个 Gate 已产出 evidence/GO_YYYYMMDD/（含 manifest.json + manifest.sha256），且 08-2 对应工单 Evidence 列已填该路径或 manifest.sha256 后，即视为 evidence 未完成部分已闭环。
