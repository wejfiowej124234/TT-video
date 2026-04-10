# GO · Epic F 发布前 E2E 三项包收口（F-01～F-08）

**标识**：文档收口 **`TT-DOC-EPIC-F-E2E-THREE-PACK-CLOSE-001`**（与代码 Gate 分离；**不**替代 **01 §9** 全量业务验收）。  
**Runbook 主入口**：[docs/runbook/Epic-F-e2e-three-pack-ladder.md](../docs/runbook/Epic-F-e2e-three-pack-ladder.md)。  
**真实路径 ADR**：[docs/runbook/Epic-F-real-path-adr.md](../docs/runbook/Epic-F-real-path-adr.md)。

## 当前范围说明

- **F-01～F-08**：Runbook、证据命名、模板、ADR、manifest 示例、**F-06** 静态校验脚本、**F-07** 独立 workflow、**F-08** 单条 **normal-release** Playwright 真实路径（chain_off REST，不 `page.route` mock 封口契约）。
- **F-10**（`pre-release-automation` / Runbook §12.5～12.6 可选挂钩 **F-06**）：**不在**本条收口范围内；仍以 **Epic F ladder** 与 **Runbook** 登记为准。
- **07 §二 2.1 三项包**：**正常放款** 除 **F-08** 自动化外，发版仍须在当次 **`evidence/GO_YYYYMMDD/`** 落 **`e2e-normal-release.md`** 等并登记 **manifest**（与 **F-02 / F-05** 一致）；**争议三终态**、**三条超时路径** **无**仓库内第二条 Playwright 自动化，仍以 **[F-03 模板](../docs/runbook/e2e-dispute-three-terminals.example.md)** / **[e2e-three-timeouts.example.md](../docs/runbook/e2e-three-timeouts.example.md)** + **手工证据** 为主。

## 已完成项清单（F-01～F-08）

| 步 | 目标（摘要） | 主产物 / 指针 |
|----|--------------|----------------|
| **F-01** | Epic F Runbook 创刊 | [Epic-F-e2e-three-pack-ladder.md](../docs/runbook/Epic-F-e2e-three-pack-ladder.md) |
| **F-02** | 三项证据文件名与 manifest 关系 | ladder **F-02**；[evidence/README.md · 07 §二 2.1](README.md#07-p0-e2e-three) |
| **F-03** | 三项 Markdown 模板（仅结构） | `docs/runbook/e2e-*.example.md` ×3 |
| **F-04** | 真实路径 ADR（本地链 + 本地 API） | [Epic-F-real-path-adr.md](../docs/runbook/Epic-F-real-path-adr.md) |
| **F-05** | `manifest.json` · `artifacts[]` 三键示例 | [Epic-F-e2e-three-pack.manifest-artifacts.example.json](../docs/runbook/Epic-F-e2e-three-pack.manifest-artifacts.example.json) |
| **F-06** | 静态证据结构校验脚本 | [scripts/check-e2e-three-pack-evidence.sh](../scripts/check-e2e-three-pack-evidence.sh) |
| **F-07** | CI：仅跑 **F-06**，**不**跑 **F-08** | [.github/workflows/e2e-three-pack-evidence.yml](../.github/workflows/e2e-three-pack-evidence.yml) |
| **F-08** | 单 spec **normal-release**（`@e2e-three-pack-real`） | `frontend/e2e/epic-f-normal-release-real.spec.ts`；ladder **F-08** |

## 真实路径 vs 模板 / 手工

| 01 §9 项 | 仓库内自动化 | 其余留痕方式 |
|----------|--------------|----------------|
| **正常放款** | **仅** **F-08**（chain_off：**created → accepted → escrowed → completed**） | 发版仍复制 **F-03** 模板为 **`e2e-normal-release.md`** 并写入 **GO** + **manifest** |
| **争议三终态** | **无**（**不**扩 dispute 自动化） | **模板 + 手工** **`e2e-dispute-three-terminals.md`** |
| **三条超时路径** | **无**（**不**扩 timeout 自动化） | **模板 + 手工** **`e2e-three-timeouts.md`** |

## F-06 · 静态证据检查命令

（**不**断言订单业务是否通过；**不**读 `.md` 正文语义。）

```bash
# 跳过（占位）
E2E_THREE_PACK_CHECK_SKIP=1 bash scripts/check-e2e-three-pack-evidence.sh

# 仅检查三文件存在（示例目录，可按需换 GO 路径）
bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407

# 另校验 manifest.json 的 artifacts[] 是否登记三条 path（须已安装 jq）
E2E_THREE_PACK_CHECK_MANIFEST=1 bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407
```

## F-08 · 真实路径运行命令

**前置**：API **`PORT=8080`**、**`SEED_TEST_ACCOUNTS=1`**、**`P3_CHAIN_OFF=1`**（**`mock-pay`** 门禁）；**`DATABASE_URL`** 空则与 CI E2E job 同形内存 chain_off。

```bash
export PORT=8080 SEED_TEST_ACCOUNTS=1 P3_CHAIN_OFF=1
cargo run -p traveltrust-api
```

另开终端：

```bash
cd frontend
npx playwright test epic-f-normal-release-real --project=chromium
# 或按标签
npx playwright test --grep @e2e-three-pack-real --project=chromium
```

- **API 基址**：**`PLAYWRIGHT_API_BASE_URL`**（默认 **`http://127.0.0.1:8080`**）。
- **CI 默认**：**`CI=true`** 且未设 **`RUN_EPIC_F_E2E_REAL_PATH=1`** 时该 spec **skip**（普通 PR **不**强制跑真实路径）。
- **本地跳过**：**`PLAYWRIGHT_SKIP_EPIC_F_REAL_PATH=1`**。

## 边界与排除项（B-115 / B-116 / P5 / Epic A / C / D / E）

| 范围 | 说明 |
|------|------|
| **B-115 / B-116 / P5** | Epic F **不**修改已封口目录下的 **行为、路由契约或分配语义**；**F-08** **不得**以 **`page.route`** 等方式 mock 上述已封口路径上的 HTTP 契约。 |
| **Epic A** | **不**改写治理执行态只读 UX 已登记实现与 **GO_EPIC_A** 叙事。 |
| **Epic C** | **不**改写 Admin cross-check / drift 只读 UI 真值源与 **GO_EPIC_C** 叙事。 |
| **Epic D** | **不**替代索引器 / 对账 / ops artifact 线；与 **E2E 三项** **并行、非替代**（见 ladder **「与三项包非替代关系」**）。 |
| **Epic E** | **不**替代 Admin 只读财务 / 对账视角；**GO_EPIC_E** 与 Epic F **正交**。 |
| **Epic F 自身** | **主产出**为 Runbook、证据约定、静态校验、**一条** real-path spec；**不**在 Epic F 前期扩写新订单/争议业务 API。 |

## 母表与 evidence 索引

- **[docs/任务母表.md](../docs/任务母表.md)** — 检索 **Epic F**。
- **[evidence/README.md](README.md)** — **Epic F** 小节锚点。
