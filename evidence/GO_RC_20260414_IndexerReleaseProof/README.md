# GO_RC_20260414 · Indexer Release Proof（正式归档 · Full GO）

本目录为 **Indexer Release Proof + GO Gate + Live replay** 的**正式检入证据包**，等级 **Full GO**（见根下 **`release_proof_rc_closure.json`** 字段 **`release_proof_grade`** / **`archive_status`**；门禁结论 **`go_gate_release_proof_audit.json`** **`verdict":"GO"`**）。

**`repo_anchor_git_commit`**（closure / preflight）：取证时工作区 **HEAD**（本地跑通 GO 时的提交）；**引入本目录的 git 提交**请用 **`git log -1 --pretty=oneline -- evidence/GO_RC_20260414_IndexerReleaseProof/`** 查看。

## 机读锚点

| 文件 | 说明 |
|------|------|
| **`go_gate_release_proof_audit.json`** | **`traveltrust.go_gate.release_proof_audit.v1`**，**`verdict":"GO"`** |
| **`release_proof_rc_closure.json`** | RC 收口；**`go_gate_replay_live": true`** |
| **`release_proof_manifest.json`** + **`release_proof_manifest.sha256`** | Release Proof 清单与侧车校验 |
| **`manifest.json`** + **`manifest.sha256`** | 本目录产物登记（**`sha256sum -c manifest.sha256`**） |
| **`preflight_record.json`** | 本轮预检/收口状态（**`completed`** / **Full GO**） |

## 制品库 / Release 上传（建议）

1. **整包**：将 **`evidence/GO_RC_20260414_IndexerReleaseProof/`** 打成 **`tar.gz` / `zip`**（或原样同步到对象存储），文件名建议含 **`GO_RC_20260414`** 与 **git commit**（见 **`release_proof_rc_closure.json`** **`repo_anchor_git_commit`**）。
2. **校验**：在解压后的目录执行 **`sha256sum -c manifest.sha256`**（或等价工具）；并对 **`release_proof_manifest.sha256`** 执行同样校验。
3. **元数据**：在制品库或 GitHub Release 说明中粘贴 **`go_gate_release_proof_audit.json`** 的 **`verdict`**、**`captured_at`**，并指向本仓库路径 **`evidence/GO_RC_20260414_IndexerReleaseProof`**。

**说明**：本机生成时若未安装 **`zip`**，可能缺少 **`indexer_evidence_bundle_*.zip`**；**`verdict":"GO`** 仍以 **`go_gate_release_proof_audit.json`** 为准。

## 复跑（本机）

一键（Docker Postgres + Anvil + API + 登录 + RC）：

```bash
bash scripts/dev-release-proof-go-one-shot.sh "$(pwd)/evidence/GO_RC_20260414_IndexerReleaseProof"
```

已有 API 与密钥时：

```bash
export API_BASE_URL="http://127.0.0.1:<PORT>"
export ADMIN_BEARER_TOKEN='…'
export INTERNAL_API_SECRET='…'
export GO_GATE_REPLAY_LIVE=1
bash scripts/run-indexer-release-proof-go-rc.sh "$(pwd)/evidence/GO_RC_20260414_IndexerReleaseProof"
```

登录接口为 **`POST /auth/login`**（非 **`/api/v1/auth/login`**）。

## CI 口径

**`INDEXER_EVIDENCE_GO_GATE_AUDIT=1`** 路径下 **仅进程退出码 `0`（GO）通过**；**`1`/`2` 均失败**。详见仓库根 **`evidence/README.md`** GO Gate 小节。
