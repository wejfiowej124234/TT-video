# 向导注册页与 DID — 企业级多维度审计报告

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **审计正文** | **下文各节** |
| **索引与发版** | **[00-文档索引](../00-文档索引.md)**、**[15-多维度文档与技术检查报告](../15-多维度文档与技术检查报告.md)** |
| **归档说明** | **[README](README.md)** |

本文档对「向导注册页面」（`/guide/register`）及与之相关的 **DID（链上身份）** 流程做多维度、深度审计，覆盖安全、数据与隐私、DID 规范、后端一致性、体验与可访问性、合规与行业标准等维度。

**审计范围**：前端 `frontend/app/guide/register/page.tsx`、`frontend/lib/apiClient.ts`；后端 `crates/api` 中 `POST /api/v1/guides`、`POST /api/v1/guides/upload-doc`、`GET /api/v1/uploads/guides/:name` 及链下业务 `chain_off::guide_create_impl`；文档 `64-申请向导-行业标准与DID检查清单.md`。

**与现行实现对齐**：本文件为**历史审计底稿**；**鉴权、上传、证件下载**等以当前代码及 **[65-企业级审计-剩余问题与缺口-20250228](../65-企业级审计-剩余问题与缺口-20250228.md) §三、§五** 为准（**`tts_*` 会话**、`extract_user_with_session_check`、魔数/大小/限流等）。

---

## 一、安全维度

### 1.1 输入校验

| 检查项 | 前端 | 后端 | 风险等级 | 说明 |
|--------|------|------|----------|------|
| 钱包地址格式 | ✅ 0x+40 位十六进制 | ✅ `is_valid_wallet_address`；可选 `VALIDATE_EIP55=1` | 低 | 见 `chain_off::guide_create_impl`。 |
| 城市必填 | ✅ `required` + 非空 trim | ✅ trim 后非空 + 最大长度 | 低 | 空串返回 `city_required`。 |
| 真实姓名/护照号 | 按产品选填 | ✅ 可选字段最大长度校验 | 低 | 格式正则可按合规再加。 |
| 国家代码 | ✅ 下拉限定 | ⚠️ 未做枚举白名单 | 低 | 开放自由输入前建议后端白名单。 |
| 语言/服务类型 | 逗号分隔，trim | ✅ 数量/单项长度上限 | 低 | 见 `guide_create_impl`。 |

### 1.2 证件上传（upload-doc）

| 检查项 | 前端 | 后端 | 风险等级 | 说明 |
|--------|------|------|----------|------|
| 文件大小 | ✅ 800KB 限制 | ✅ 解码后 ≤800KB | 低（历史行已闭合） | 后端 `upload_guide_doc` 与前端一致量级。 |
| 文件类型 | ✅ accept + MIME 推断 | ✅ 魔数校验 JPEG/PNG/WebP/PDF | 低（历史行已闭合） | 与现行 `routes/guides.rs` 一致。 |
| 认证 | — | ✅ 需登录 | 通过 | `upload_guide_doc` 使用 **`extract_user_with_session_check`**（Bearer/`sessions` 或联调头），未登录 401。 |
| 路径遍历 / 文件名 | — | ✅ 安全 | 通过 | 服务端用 UUID+扩展名生成文件名；`serve_guide_upload` 拒绝 `..` 及非法字符。 |

### 1.3 幂等与重复提交

| 检查项 | 现状 | 风险等级 | 说明 |
|--------|------|----------|------|
| 前端防重复点击 | ✅ `loading` 时 disable 提交按钮 | 低 | 可防用户连续点击。 |
| 幂等键 | ❌ 未传 Idempotency-Key | 中 | 当 `REQUIRE_IDEMPOTENCY_KEY=1` 时，POST /api/v1/guides 会 400；生产若开启幂等策略，前端必须为「向导注册」生成并传递幂等键。 |
| 后端已存在向导 | ✅ 409 already_guide | 通过 | 前端正确识别并展示「您已是向导」。 |

### 1.4 其他

- **XSS**：文案均来自 i18n 或用户输入；用户输入在 React 中默认转义，未见 `dangerouslySetInnerHTML`，风险低。文件名展示为 `pendingIdPhoto`/`pendingLangCert` 等，若将来来自服务端需做转义或白名单。
- **CSRF**：Bearer / `tts_*` 会话与 Same-Origin 组合下风险可控；若引入 Cookie 跨站场景需单独评估。
- **上传接口限流**：`upload_guide_doc` 已做**用户级**窗口限流（超限 429）；多实例建议网关层再叠一层。

---

## 二、DID 维度

### 2.1 格式与规范

| 检查项 | 现状 | 建议 |
|--------|------|------|
| 地址格式 | 前端 0x+40 位十六进制（大小写不限） | 与 EVM 一致；可选：增加 EIP-55 校验和校验，减少笔误。 |
| 等效 DID 展示 | ✅ `did:ethr:0x…`（小写） | 符合 did:ethr 常见用法；若需多链可考虑 did:ethr:&lt;chainId&gt;:0x…。 |
| 链 ID | 未显式绑定 chainId | 产品若多链，建议在 DID 或账户模型中区分链（如 Polygon mainnet）。 |
| 后端 DID 存储 | 存 `wallet_address` 明文 | 符合「账号↔向导 DID 绑定」；访问控制与保留期限见合规维度。 |

### 2.2 绑定与一致性

- **账号↔向导 DID**：后端 `guide_create_impl` 以 `user_id` 绑定向导行，`wallet_address` 存于 `GuideRow`，逻辑正确。
- **连接钱包 vs 填写地址**：前端使用 wagmi `useAccount`，支持「使用当前钱包」填入；若填写与连接一致则提示「与当前连接的钱包一致」。未强制「必须连接钱包」或「填写地址必须与连接一致」，属产品选择；若需强一致可增加校验。

### 2.3 与《申请向导-行业标准与DID检查清单》对照

- DID 主体、绑定、控制权（不托管私钥）：已覆盖且符合。
- 链上 DID Document、VC、KYC：仍为缺口，见该文档 §二、§四 P1；本审计不重复，仅确认前端/后端无新增偏离。

---

## 三、数据与隐私维度

### 3.1 敏感数据

| 数据 | 前端 | 后端 | 说明 |
|------|------|------|------|
| 护照号 | 提交成功后敏感字段已清空（见 §九） | 仅存 Keccak256 哈希 | 保留期限与删除策略仍待合规定稿（见 **64** §七）。 |
| sessionStorage | 存 PendingGuide（含证件 Base64） | — | 提交成功后移除 key；未提交前仍在 session，建议会话超时或离页提示（产品）。 |
| 证件 URL | 同上 | ✅ **已鉴权** | `serve_guide_upload`：登录 + 本人 URL 后缀（含 **guide_license** 等）或 **admin/super_admin**；详见 **[65](../65-企业级审计-剩余问题与缺口-20250228.md) §三·S2**。 |

### 3.2 同意与告知

- 隐私/服务条款勾选、DID 与护照用途说明：已实现且与检查清单一致。

---

## 四、后端一致性与健壮性

本节历史「建议」已与 **`guide_create_impl`**、**`upload_guide_doc`**、**`serve_guide_upload`** 对齐，**勿与 §1.1、§1.2、§九重复阅读**。开放项：**国家枚举**、**多链 chainId**、**合规定稿**见 **64**、**65**。

---

## 五、体验与可访问性（a11y）

### 5.1 表单

- 多数输入有 `<label>` 与 placeholder，结构清晰。
- 错误信息：`setError(...)` 在表单下方统一展示，但错误区域**未与控件通过 aria-describedby 或 aria-errormessage 关联**，读屏用户可能难以对应到具体字段；建议为钱包等关键字段增加 `aria-describedby` 指向错误容器，或在行内展示字段级错误。
- 必填：仅 city 为 `required`；若产品上真实姓名/护照为必填，应加 `required` 与 `aria-required`，并在后端同步校验。

### 5.2 焦点与状态

- 提交中：按钮 disabled，可考虑在错误区域或按钮旁增加 `aria-live="polite"` 的「提交中…」提示，便于读屏。
- 成功/已是向导：整页替换为结果视图，焦点未显式移至结果标题或主要链接；建议 `setDone(true)`/`setIsAlreadyGuide(true)` 后对结果区做 `focus()` 或 `aria-live="assertive"`，便于辅助技术用户获知状态变化。

### 5.3 国际语言

- 文案已接入 i18n（中/英），下拉语言切换已实现；国家/地区下拉当前仅首项「请选择」随语言切换，国家名仍为中文，若需全语言可扩展 locales。

---

## 六、合规与行业标准

- 与《申请向导-行业标准与DID检查清单》§一、§七 对齐情况：
  - **身份与资质**：护照/姓名/证件上传/语言证明已实现；**向导证**可为可选 **`guide_license_url`**（**64**）；是否强制必传为产品决策。
  - **数据与隐私**：同意、护照号哈希、证件持久化已实现；访问控制、保留期限、删除策略仍待合规定稿。
  - **DID**：前端 DID 展示与绑定逻辑符合文档；KYC/VC、DID Document、链上锚定为 P1 缺口，无新增偏离。

---

## 七、审计发现汇总表（历史编号；**闭合状态以 §九为准**）

| 编号 | 维度 | 原审计摘要 | 当前状态（代码） |
|------|------|------------|------------------|
| F1 | 安全 | 钱包格式 | ✅ 已校验（§九） |
| F2 | 安全 | 上传大小/魔数 | ✅ 已实施（§九） |
| F3 | 安全 | Idempotency-Key | ✅ 前端已传（§九）；生产是否强制见环境变量 |
| F4 | 安全 | upload-doc 限流 | ✅ 用户级限流（§九） |
| F5 | 后端 | city / 长度 | ✅ 已实施（§九） |
| F6 | DID | EIP-55 / chainId | ⚠ 可选 EIP-55 环境开关；chainId 产品项 |
| F7 | 隐私 | 敏感清空 / 证件鉴权 | ✅ 前端清空 + **serve** 鉴权（**65** S2）；保留策略仍待合规 |
| F8 | a11y | 错误/焦点 | ✅ 已加强（§九） |
| F9 | 体验 | 国家名 i18n | ⚠ 仍待（低优） |

---

## 八、建议优先级

历史 P0/P1/P2 已大部分在 **§九** 闭合。**开放项**：F6（多链）、F9（国家 i18n）、合规定稿（**64**、**65**）。

---

## 九、修补与优化实施记录（本轮）

| 编号 | 实施内容 | 状态 |
|------|----------|------|
| F1 | 后端 `guide_create_impl` 增加钱包格式校验（0x+40 位十六进制），非法返回 400 invalid_wallet_address | ✅ 已实施 |
| F2 | 后端 `upload_guide_doc`：解码后限制 ≤800KB（413）；魔数校验 JPEG/PNG/WebP/PDF | ✅ 已实施 |
| F3 | 前端 `postGuide` 支持传入 Idempotency-Key；向导注册提交时生成并传递 | ✅ 已实施 |
| F5（部分） | 后端拒绝 city 为空；city/real_name/passport/bio/wallet/languages/service_types 长度与数量约束 | ✅ 已实施 |
| F7（前端） | 后端 400 错误码在 parseResponse 中抛出 code，前端 catch 映射为 i18n（errorCity/errorWallet/fileTooBig/errorFileType） | ✅ 已实施 |
| F8 | 钱包输入 aria-invalid、aria-describedby 关联 wallet-error；表单错误 id + role="alert"；提交按钮 aria-busy/aria-describedby；成功/已是向导区域 ref + tabIndex=-1 + useEffect 聚焦 | ✅ 已实施 |
| F4 | `upload_guide_doc` 用户级窗口限流（超限 429） | ✅ 已实施 |
| F7（serve） | 证件下载鉴权（本人/管理员） | ✅ 已实施（**65** S2） |

**文档版本**：1.1（与 `guides.rs` / `chain_off/guides.rs` 对齐，归档底稿）  
**审计基准**：向导注册页与 DID 相关实现及 **64**（v1.0.2）。  
**最后更新**：2026-03-26
