# REG-04 · API 体系叙事（**不**含 §3.4 表体）

**Version:** 1.0.6 · **最后更新：** 2026-04-29  
**受众**：后端 / 全栈 / 审阅 **HTTP 契约** 的工程师  
**状态**：现行（**corpus** 再生稿）  
**与 spec 关系**：由 **[spec/04-后端与API](../../spec/04-后端与API.md)** **叙事侧**浓缩；**§3.4** **`| METHOD | /path |`** **全量表体**仍为 **spec/04** **唯一机读 SSOT**；本文**禁止**粘贴或平行维护第二套路由全表。  
**与 handbook 关系**：与 **[engineering/04-HTTP与路由契约导读](../engineering/04-HTTP与路由契约导读.md)** **同簇**——该篇教「**怎么对拍**」与 **§6** 工程验证命令；本文教「**文档地图与职责边界**」。

> **SSOT 边界（防误用）**：本文为 **corpus** **API 叙事导读**；**§3.4 机读窗**仍以 **[spec/04](../../spec/04-后端与API.md)** + **`run-check-04-routes`** 为准；**93** 矩阵仍以 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 为准；**对拍操作**以 **[engineering/04](../engineering/04-HTTP与路由契约导读.md)** 为准。**禁止**以本文或 **OpenAPI** 维护第二套路径全表替代 **04**；**禁止**仅凭本文删 **`docs` 下 `spec` 子树**（程序见 **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)** + **[engineering/09 §3](../engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）+ **[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](./SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**）。下表 **§1** 为同口径展开。

---

<a id="reg04-ssot"></a>

## §1 SSOT 边界（必读）

| 内容 | 真源 | 本文职责 |
|------|------|----------|
| **v1 路径 / 方法 / 前端页路由全表** | **[04 §3.4](../../spec/04-后端与API.md)** | **只外链**；改 API **须**先改表体再跑门禁 |
| **字段级 JSON 契约、错误码散文** | **04** 各节 + **14** | 入口指针，**不**复述宽表 |
| **93 矩阵行与 `matrix_93_*` 脚注** | **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** | 链 **§8.4** 与域族名 |
| **路由挂载顺序与 `merge`** | **`crates/api/src/routes/mod.rs`** | 与 **04**、**[14 §2.1](../../spec/14-合约-API-ABI-前后端对齐.md)** 对读 |

**B-181（路由宿主路径字面）**：**[spec/00 读前摘要](../../spec/00-文档索引.md)** 与部分 **`.github/workflows`** 仍可能出现 **`routes/internal.rs`**、**`routes/community.rs`** 等历史字面；**开文件与排查挂载**以 **`crates/api/src/routes/internal/mod.rs`**、**`…/community/mod.rs`** 等**目录入口**为准。**HTTP 方法/路径**仍以 **04 §3.4** 与 **`bash scripts/run-check-04-routes.sh`** 为准；**不得**因锚点字面过旧推断域缺失。详见 **[engineering/04 · §2](../engineering/04-HTTP与路由契约导读.md)**。

---

<a id="reg04-map"></a>

## §2 读 **spec/04** 的推荐顺序（叙事，非目录克隆）

1. **读前摘要表**（**04** 文首）→ 选你的「单源」行，**跳锚**到对应节。  
2. **§一～§二**（数据表 / core）→ 改表结构时必读。  
3. **§三**（路由 v1 叙事、鉴权、内部 API 总述）→ 与 **§3.4** **配合**读；**实现以 §3.4 表 + 代码为准**。  
4. **§四～§五**（风控、落地顺序）→ 与 **[07](../../spec/07-开发流程与顺序.md)**、**[01](../../spec/01-总库总览.md)** 交叉。  
5. **§六**（审计标注、版本三线互指）→ bump **04 `Version:`** 时同步 **[手册 00 §六](../00-手册总览与编制规范.md)** 与 **`check-07-version-triple`**（见 **[23](../engineering/23-横切-07开发流程导读.md)**）。

---

<a id="reg04-engineering"></a>

## §3 工程闭环（与脚本、CI 同源）

| 步骤 | 动作 |
|------|------|
| 1 | 改 **`routes/*`** 与 **`mod.rs`** 挂载 |
| 2 | 改 **04 §3.4** 对应行（**CONTRIBUTING** 同口径） |
| 3 | **`bash scripts/run-check-04-routes.sh`** → **exit 0** |
| 4 | 更新 **93** 脚注或 **N/A** 流程（**96-01** 束表若适用） |

**门禁族**与 **[engineering/04 §6](../engineering/04-HTTP与路由契约导读.md#hb-eng-04-verify)** 一致；**PR** 不得在未绿脚本下合入契约变更（**[02](../engineering/02-生产级文档约束与合入门禁.md)**）。

---

<a id="reg04-corpus"></a>

## §4 与 **corpus REG-01～03**、**engineering/04** 的分工

**覆盖口径**：**`REG-01`～`REG-04`** 已落盘状态与 **[SPEC-MIGRATION-STATUS §3](./SPEC-MIGRATION-STATUS.md)**、**[手册 00 · §8](../00-手册总览与编制规范.md#hb-00-corpus)**、**[corpus/README](./README.md)** 主表一致；**04 §3.4** **`| METHOD | /path |`** 全量表体仍以 **spec/04** 为 SSOT（**不**因本文或 **engineering/04** 导读而迁移）。

| 文档 | 回答的问题 |
|------|------------|
| **REG-01** | 业务总览与链/DB 心智 |
| **REG-02** | 分层与领域 |
| **REG-03** | 流程与风控状态机 |
| **本文 REG-04** | **API 文档地图** + SSOT 边界 + 合入顺序 |
| **engineering/04** | **对拍操作**（§1 四步 + **§4** 命令） |

---

## §5 显式非目标

- **不**把 **04** 全文搬入 **corpus**（违反 **SPEC-MIGRATION** 与 **[08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)**/**[09 §3](../engineering/09-文档迁移覆盖审计报告.md#audit-coverage)** 迁移程序链）。  
- **不**以「REG 已写」为由跳过 **04 §3.4** 更新。  
- **不**在本文嵌 **OpenAPI** 全量导出替代 **04**（若将来机读窗迁移，须 **Owner** 与 **P-C** 同批）。

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.6 | 2026-04-29 | **SSOT 边界**：程序链内 **98** 链接展示统一为 **98 §2**（与 **REG-01～03**/**corpus/README** 同条）。 |
| 1.0.5 | 2026-04-29 | **SSOT 边界**/**§5**：删 **spec**/**搬 04** 程序链显式 **08 §3**/**09 §3**（与 **corpus/README**/**REG-01～03** 同条）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT 边界** 块引（与 **REG-01～03** 同程序链；**§1** 标为展开）。 |
| 1.0.3 | 2026-04-29 | **§1** 后：**B-181** 索引/workflow 历史字面 vs **`routes/*/mod.rs`**；链 **engineering/04 §2**。 |
| 1.0.2 | 2026-04-29 | **§4**：标题显式 **corpus**/**engineering/04**；增 **SPEC-MIGRATION §3** / **手册 00 §8** / **corpus README** 覆盖口径一句。 |
| 1.0.1 | 2026-04-28 | 互指 **engineering/04 §6**（与导读 **§6 工程验证** 一致）。 |
| 1.0.0 | 2026-04-28 | 首版：API 叙事 + SSOT 边界；**不**含 **§3.4** 表体。 |

---

**Reviewed-by:** @ghost 2026-04-28（默认 **CODEOWNERS**；替换规则见 **[EVIDENCE-04-api-cluster-verified §V-3](../engineering/EVIDENCE-04-api-cluster-verified.md#ev04api-v3)**）

**返回**：[corpus README](./README.md) · [engineering/04-HTTP导读](../engineering/04-HTTP与路由契约导读.md) · **[04 §3.4](../../spec/04-后端与API.md)**
