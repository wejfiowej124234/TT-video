# Jurisdiction rollout（辖区国池账本配置模板）

本章节说明如何通过 **Task B-1** 配置模板为 **新增辖区** 登记 **`CountryPoolLedger`** 合约地址，并完成部署与验收。口径与 **`docs/spec/04-后端与API.md`** 文档 **3.4 API 总览** 主表中 **`GET /api/v1/country-ledger/:jurisdiction`** 一行一致。

**范围边界**

- **本模板**只驱动 **`GET /api/v1/country-ledger/:jurisdiction`** 的 **配置命中** 响应（**`data_source: chain_ssot`**），**不**从 **`fee_router`** 推导，**不**读取 DB 投影（如 **`p5_country_ledger_lines`**）冒充链上真值。
- **P5-1-C** 的链上只读视图仍在 **`GET /api/v1/governance/country-ledger/:jurisdiction`**（**`rule_version: country_ledger_ssot_v0`**、**`eth_call`** 等）；与 B-1 路由 **相互独立**。进程级 **`COUNTRY_POOL_LEDGER_ADDRESS`** 用于索引器 / P5-1-C 等路径，**不会**作为 B-1 的回落地址。

---

## 如何新增 jurisdiction

1. **准备 JSON 配置文件**  
   - 以仓库内模板为起点复制一份实例文件（勿直接改仓库里的模板）：  
     **`config/jurisdiction_country_ledger.template.json`**
   - 顶层字段：
     - **`schema_version`**：当前为 **`1`**（保留字段，便于日后迁移）。
     - **`entries`**：对象数组；每一项表示一个辖区与其账本合约。

2. **为每条 entry 填写**

   | 字段 | 说明 |
   |------|------|
   | **`jurisdiction`** | **恰好两个 ASCII 字母**（大小写均可写入文件；HTTP 路径里会规范为**大写**）。 |
   | **`COUNTRY_POOL_LEDGER_ADDRESS`** | **`CountryPoolLedgerV0`**（或同接口部署）的合约地址：**`0x` + 40 位十六进制**，且 **不得为全零地址**。不符合格式的行会在加载时被 **跳过**（静默忽略该条）。 |

3. **合并策略**  
   - 同一 **`jurisdiction`** 若出现多条合法 entry，**后出现的覆盖先前的**（实现为顺序插入 HashMap）。建议每个辖区只保留一行，避免歧义。

4. **校验（建议）**

   - 启动或发版前用只读请求确认该辖区已注册（见下文「部署后验收」）。
   - 若某辖区在文件中缺失或地址被跳过，**`GET /api/v1/country-ledger/:jurisdiction`** 返回 **`404`**，**`jurisdiction_not_in_registry`**——这是预期行为，**不存在**「自动回落到环境变量单址」的逻辑。

---

## 部署步骤

1. **将配置文件放到运行环境可读路径**  
   例如：`/etc/traveltrust/jurisdiction_country_ledger.json`（路径与权限由运维自定；需 **API 进程用户可读**）。

2. **设置环境变量并重启 API**  
   - 设置 **`JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH`** 为该文件的**绝对路径**（见下一节）。  
   - **重启** **`traveltrust-api`** 使注册表在进程内重新加载（当前实现为 **启动时一次性读取**，热更新需重启）。

3. **部署后验收**

   ```http
   GET /api/v1/country-ledger/XX
   ```

   - **已配置且地址合法**：**`200`**，响应体 **仅**：
     ```json
     { "jurisdiction": "XX", "data_source": "chain_ssot" }
     ```
   - **未配置**：**`404`**，体含 **`error` / `message`: `jurisdiction_not_in_registry`**。
   - **路径非法**（非两字母等）：**`400`**，**`invalid_jurisdiction`**。

4. **配置读失败时的行为**  
   若路径已设但文件不存在、不可读或 JSON 无法解析，进程会 **`eprintln`** 告警并 **使用空注册表**；此时所有辖区对上述 GET 均为 **`404`**，直至修复文件并重启。

---

## 环境变量说明

| 变量 | 必填 | 作用 |
|------|------|------|
| **`JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH`** | 否（若不用 B-1 命中接口可省略） | 指向 **辖区账本模板 JSON** 的文件路径。未设置或为空 → **空注册表**，**`GET /api/v1/country-ledger/:jurisdiction`** 对任意合法两字母辖区均 **`404`**。要开放该接口的 **200** 命中，须在运行环境设置本变量并指向有效 JSON。 |

**与本主题相关、但语义不同的变量（勿混淆）**

| 变量 | 说明 |
|------|------|
| **`COUNTRY_POOL_LEDGER_ADDRESS`** | 链配置中的 **单一** 国池账本地址，供 **P5-1-B 索引拉取**、**P5-1-C** **`GET …/governance/country-ledger/:jurisdiction`** 等使用。**不会**被 B-1 的 **`GET /api/v1/country-ledger/:j`** 用作回落。 |
| **`CHAIN_RPC_URL`**、**`COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS`** 等 | 与 **治理国池账本链上只读**（P5-1-C）相关；与 B-1 **配置命中接口**无直接耦合。 |

---

## CLI 可执行步骤（AI 用）

以下在 **仓库根目录** 执行（**bash**；Windows 可用 **Git Bash** / **WSL**）。将路径与端口按本机修改。

```bash
# 1. 准备配置（示例：复制模板后编辑真实地址）
cp config/jurisdiction_country_ledger.template.json ./jurisdiction_country_ledger.json

# 2. 声明配置路径（绝对路径更稳）
export JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH="$PWD/jurisdiction_country_ledger.json"

# 3. 启动 API（默认 PORT=8080）
cargo run -p traveltrust-api

# 4. 验证（另开终端；CN 须在 JSON entries 中命中）
curl -sS "http://127.0.0.1:8080/api/v1/country-ledger/CN"
```

期望 **200** 时体为 **`{"jurisdiction":"CN","data_source":"chain_ssot"}`**（键名以实际响应为准）。**404** 表示未命中注册表或配置未加载。

---

## 参考路径

- 模板：`config/jurisdiction_country_ledger.template.json`
- API 契约：`docs/spec/04-后端与API.md`（**3.4 API 总览** 主表 **`GET /api/v1/country-ledger/:jurisdiction`**）
- 实现：`crates/api/src/jurisdiction_country_ledger_template.rs`、`crates/api/src/routes/country_ledger_jurisdiction.rs`
