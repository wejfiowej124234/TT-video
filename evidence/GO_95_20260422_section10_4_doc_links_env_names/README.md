# GO_95 · §10.4 旧文档 / 旧 env 名 — 局部机读（2026-04-22）

## 1. 定位

**《95》§10.4** 共 **4** 子条；**v1.4.147** 起 **四子条全 `[x]`**（**第四子条** **§10.4-4** — **重复 spec / SSOT·companion（有界）** 见 **§9**）；**v1.4.146** **第三子条**（**`docs/spec` · 嵌入图链 + `http://` 外行 host**）**`[x]`**；**首·二子条** **`[x]`**（**v1.4.145**/**v1.4.144**）。本包为 **§10.4** 与 **v1.4.118** **00 本地链**/**53·`NEXT_PUBLIC_API_BASE_URL`** 子集之**同址续写**。

## 2. **00-文档索引** 体内本地 `.md` 链接（相对 `docs/spec/`）

**范围**：`docs/spec/00-文档索引.md` 中 Markdown 链接 **`](…)`** 目标以 **`.md` 结尾**、且**非** `://` 外链者；路径按 **相对 `docs/spec/`** 解析（含 **`../…`** / **`../../…`**）。

**工具**（仓库根执行）：

```python
import re
from pathlib import Path

base = Path("docs/spec")
text = (base / "00-文档索引.md").read_text(encoding="utf-8")
paths = re.findall(r"\]\(([^)#\s]+)\)", text)
missing = []
checked = 0
for raw in paths:
    if "://" in raw or raw.startswith("#"):
        continue
    if not raw.endswith(".md"):
        continue
    raw = raw.split()[0].rstrip(")")
    if raw.startswith("../../"):
        p = (base.parent.parent / raw.replace("../../", "")).resolve()
    elif raw.startswith("../"):
        p = (base.parent / raw[3:]).resolve()
    else:
        p = (base / raw).resolve()
    checked += 1
    if not p.exists():
        missing.append((raw, str(p)))
print("checked", checked, "missing", len(missing))
for r, _ in missing[:20]:
    print("MISSING", r)
```

**本轮**：**`checked` 523**、**`missing` 0**（在 **纠** **`docs/spec/00-文档索引.md`** **两处**误指 **`snapshots/00-文档整理清单-分类与重排.md`** → **`00-文档整理清单-分类与重排.md`**（**§00 治理兼容入口**表行 + **篇首读前摘要**旧链）及 **§15 互证表** 文档名列对齐之后）。

## 3. **`NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_API_BASE_URL`**

**纠文**：

- `docs/spec/53-阶段开发技术文档.md` — **§六** E2E 定稿表 **API base URL** 行；
- `frontend/__tests__/integration/README-53.md` — **E2E 环境定稿表** 同行。

**机读**：**`53`** E2E 定稿表与 **`README-53`** 表行已统 **`NEXT_PUBLIC_API_BASE_URL`**；仓库内 **`NEXT_PUBLIC_API_URL`** 字面量仅保留于 **本证据 README**（本节标题/说明）与 **95**（**§0.2 / §12.4 / §6** 对本轮工作的**自述**），**不**再作为 **spec / 集成说明** 的**规范性 env 名**。

## 4. 契约闸

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（本证据落盘当次 · v1.4.147 复跑）
```

## 5. 诚实边界（v1.4.118 起）

- **§10.4** 首条（**已删文档从 00 / 根 README 导航移除**）→ **v1.4.145** 证 **`00` `523` + 根 `README` `51`** **`*.md` 目标** → **`missing` 0**（**§7**）；**不**扫 **子包 README 全扇面**；**不**等价「**已归档**」人读句式审计。
- **§10.4** 第三行（**截图路径/域名 · `docs/spec` 扇面**）→ **v1.4.146** **`[x]`**（**§8**）；**第四行**（**重复 spec / SSOT·companion**）→ **v1.4.147** **`[x]`**（**§9**；**有界**）。
- **`P/Q`、`U/C`、总完成度 %** → **v1.4.147** 因 **§10.4-4** **`[x]`** → **`P=19→20`**、**`K=19/22→20/22`**、**`总 %=47→48`**；**v1.4.146** 因 **§10.4-3** **`[x]`** → **`P=18→19`**、**`K=18/22→19/22`**、**`总 %=46→47`**；**v1.4.145** 因 **§10.4-1** **`[x]`** → **`P=17→18`**、**`K=17/22→18/22`**、**`总 %=45→46`**；**v1.4.144** 因 **§10.4-2** **`[x]`** → **`P=16→17`**、**`K=16/22→17/22`**、**`总 %=44→45`**（见 **95 §0.2**）。

## 6. **§10.4-2** — 主 README / 发版检查 · 弃用 **`NEXT_PUBLIC_API_URL`**（**有界 `[x]` · v1.4.144**）

**范围（显式四文件）**：仓库根 **`README.md`**、**`CONTRIBUTING.md`**、**`docs/go-live-checklist.md`**、**`ops/RUNBOOK.md`**。

**机读**：对上述四文件 **`NEXT_PUBLIC_API_URL`** **0** 命中（IDE **`rg`** / 等价 **`grep`**）。

**全仓字面量**（**`rg NEXT_PUBLIC_API_URL`**，仓库根）：命中 **2** — **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`**（**§10.4-2** 本轮自述）+ **本 `README.md`**（**§3**/**§6** 标题与说明）。

**契约闸**：**`bash scripts/run-check-04-routes.sh` → exit 0**（**v1.4.144** 落盘当次）。

**诚实边界**：

- **不**等价「**全仓** 任意 **`README*.md`** / **`docs/**`** 已无其它历史 env 名」— 本轮仅锚 **弃用 `NEXT_PUBLIC_API_URL`** 与 **四份入口文档**。
- **不**替代 **`.github/workflows/*`** 内 env 叙事全审计（**ISS-007**/**E2E** 仍开）。
- 与 **v1.4.118** **53/README-53**/**00 本地链**/**§10.4-1**/**§10.4-3**/**§10.4-4** 子证**并列**；**§10.4** **四子条全 `[x]`**（**v1.4.147** **§9**）。

## 7. **§10.4-1** — **`00`+根 `README` · 本地 `*.md` 链 0 缺失（有界 `[x]` · v1.4.145）**

**§2（`00`）**：同 **§2** 脚本；**`checked` 523**、**`missing` 0**。

**根 `README.md`**（**相对仓库根**解析 **`](../foo.md)`** / **`(foo.md)`** / **`(docs/…)`** 等，**目标以 `.md` 结尾**、**非** `://`）：

```python
import re
from pathlib import Path

root = Path(".")
text = (root / "README.md").read_text(encoding="utf-8")
paths = re.findall(r"\]\(([^)#\s]+)\)", text)
missing = []
checked = 0
for raw in paths:
    if "://" in raw or raw.startswith("#"):
        continue
    if not raw.endswith(".md"):
        continue
    raw = raw.split()[0].rstrip(")")
    p = (root / raw).resolve()
    checked += 1
    if not p.exists():
        missing.append((raw, str(p)))
print("checked", checked, "missing", len(missing))
for r, _ in missing[:20]:
    print("MISSING", r)
```

**本轮**：**`checked` 51**、**`missing` 0**。

**契约闸**：**`bash scripts/run-check-04-routes.sh` → exit 0**（**v1.4.147** 落盘当次）。

**诚实边界**：**不**扫 **`frontend/README.md`** 等子树；**不**替 **「已归档」** 措辞全仓 triage。

## 8. **§10.4-3** — **`docs/spec` · 嵌入图链 + `http://` 外行 host（有界 `[x]` · v1.4.146）**

### 8.1 Markdown 嵌入图（相对路径、无 `://`）

**范围**：`docs/spec/**/*.md` 中 **`![alt](target)`**；**`target`** 无 `://`、非 `#` 片段、非 `data:`；按 **含该行的 Markdown 文件所在目录** 解析相对路径。

```python
import re
from pathlib import Path

img_re = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
spec = Path("docs/spec")
missing = []
checked = 0
for md in spec.rglob("*.md"):
    text = md.read_text(encoding="utf-8")
    base = md.parent
    for m in img_re.finditer(text):
        raw = m.group(1).strip().split()[0].strip('"').strip("'")
        if raw.startswith("data:") or "://" in raw or raw.startswith("#"):
            continue
        if raw.startswith("//"):
            continue
        if raw.lower().startswith("http"):
            continue
        tgt = (base / raw).resolve()
        checked += 1
        if not tgt.exists():
            missing.append((md.as_posix(), raw))
print("image_embeds_relative_checked", checked, "missing", len(missing))
for a, b in missing[:20]:
    print("MISSING", a, "->", b)
```

**本轮**：**`checked` 0**、**`missing` 0**。

### 8.2 `http://` 外行 host（扣本地与 scheme 字面）

**范围**：同上 **`docs/spec/**/*.md`** 逐行；**`host_re`** 抽 **`http://(host)`**；**`allow_line`** 跳过 **`localhost`/`127.*`/`0.0.0.0`/`<private-host>`**、**`` `http://` ``** scheme 字面、**`http(s)`** 叙述。

```python
import re
from pathlib import Path

host_re = re.compile(r"http://([^/\s)]+)(?::[0-9]+)?")


def allow_line(line: str) -> bool:
    s = line
    if "`http://`" in s:
        return True
    if "http(s)" in s.lower():
        return True
    low = s.lower()
    if "http://localhost" in low or "http://127." in low or "http://0.0.0.0" in low:
        return True
    if "http://<private-host>" in low:
        return True
    return False


spec = Path("docs/spec")
hits = []
for md in spec.rglob("*.md"):
    for i, line in enumerate(md.read_text(encoding="utf-8").splitlines(), 1):
        if "http://" not in line:
            continue
        if allow_line(line):
            continue
        for m in host_re.finditer(line):
            host = m.group(1).lower()
            if host in ("localhost", "127.0.0.1", "0.0.0.0"):
                continue
            hits.append((md.as_posix(), i, host, line.strip()[:200]))
print("suspicious_http_host_hits", len(hits))
for h in hits[:20]:
    print(h)
```

**本轮**：**`suspicious_http_host_hits` 0**。

### 8.3 常见外链图床关键字（`docs/spec`）

仓库根（**Git Bash**）：**`rg -n "imgur|gyazo|prntscr|ibb\\.co" docs/spec --glob '*.md'`** → **0** 命中。

**诚实边界**：**不**等价「**全仓** 无 **`http://`**」— **`ops/RUNBOOK.md`** 等仍可有 **`http://127.0.0.1:8080`** **curl** 示例；**不**扫 **`docs/runbook`/`evidence`/`frontend`**；**不**替 **「过时截图已人工替换」** 叙事 — 本轮仅 **机读 0 断链 / 0 外行 host / 0 图床关键字（spec 扇面）**。

## 9. **§10.4-4** — **`00` 主表编号 + companion / SSOT 文件面（有界 `[x]` · v1.4.147）**

### 9.1 主表 **`| N |`** 编号列 — **0 重复 ID**

```python
import re
from pathlib import Path
from collections import Counter

text = Path("docs/spec/00-文档索引.md").read_text(encoding="utf-8")
ids = []
for line in text.splitlines():
    m = re.match(r"^\|\s*([0-9]+(?:-[0-9]+)?)\s*\|", line)
    if m:
        ids.append(m.group(1))
ctr = Counter(ids)
dups = [k for k, v in ctr.items() if v > 1]
print("numbered_row_ids", len(ids), "unique", len(ctr), "dups", dups)
```

**本轮**：**`numbered_row_ids` 114**、**`unique` 114**、**`dups` `[]`**。

### 9.2 固定 **companion / 兼容壳 / 附录** 文件面（相对 `docs/spec/` 必存在）

下列路径与 **00** 篇首/主表对 **07**、**14+附录**、**50+50-报告**、**43～46 整合**、**00-文档使用分层说明** 之显式叙事一致（**不**扫全表逐格）：

```python
from pathlib import Path

base = Path("docs/spec")
need = [
    "00-文档体系与阅读串联.md",
    "07-开发流程与顺序.md",
    "14-合约-API-ABI-前后端对齐.md",
    "14-附录-API与ABI对齐检查报告.md",
    "50-阶段-后续优化与开发清单.md",
    "50-前端与规范一致性检查报告.md",
    "43-46-阶段技术文档整合.md",
    "46-前端规范与清单-合并版.md",
    "00-文档使用分层说明-旧整合与现行SSOT.md",
]
missing = [p for p in need if not (base / p).exists()]
print("need", len(need), "missing", len(missing))
for p in missing:
    print("MISSING", p)
```

**本轮**：**`missing` 0**。

### 9.3 **`00-文档体系与阅读串联.md`** 体内本地 **`*.md`** 链（相对 `docs/spec/`）

与 **§2** 同构解析（**`base = docs/spec`**；**目标 `*.md`**、**非** `://`）：

```python
import re
from pathlib import Path

base = Path("docs/spec")
text = (base / "00-文档体系与阅读串联.md").read_text(encoding="utf-8")
paths = re.findall(r"\]\(([^)#\s]+)\)", text)
missing = []
checked = 0
for raw in paths:
    if "://" in raw or raw.startswith("#"):
        continue
    if not raw.endswith(".md"):
        continue
    raw = raw.split()[0].rstrip(")")
    if raw.startswith("../../"):
        p = (base.parent.parent / raw.replace("../../", "")).resolve()
    elif raw.startswith("../"):
        p = (base.parent / raw[3:]).resolve()
    else:
        p = (base / raw).resolve()
    checked += 1
    if not p.exists():
        missing.append((raw, str(p)))
print("checked", checked, "missing", len(missing))
for r, _ in missing[:20]:
    print("MISSING", r)
```

**本轮**：**`checked` 13**、**`missing` 0**。

### 9.4 契约闸

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（本证据落盘当次 · v1.4.147 复跑）
```

### 9.5 诚实边界

- **不**声称 **`docs/spec` 全 ~376 篇** 无「同题多文」— 本轮仅以 **00 主表编号唯一** + **§9.2 固定清单** + **§9.3 兼容壳体内链** 为界。
- **不**替 **§12 · S-6**/**`code-maps`/`snapshots`/`27-archived`** 全文对拍；**不**将 **模块化多文件**（如 **`46-*.md`** 族）自动标为「未合并」。
