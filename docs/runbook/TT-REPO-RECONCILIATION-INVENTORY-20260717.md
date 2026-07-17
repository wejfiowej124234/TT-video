# Repository Reconciliation · Inventory（2026-07-17）

**Constraint:** `TT_PRODUCTION_GO=GO` kept · Tag `v1.1.0-psg-go.20260717` → `0bbc7adb…` unchanged · no deploy during classify  
**Correct push remote:** `traveltrust-v11` → `git@github.com:TT-Expedition/TravelTrust-V1.1.git`  
（`origin`/`tt-video` = TT-video · `legacy` = Wbe3 · **勿**作本仓主推送）

## Bucket counts（porcelain ~4179）

| Bucket | ~N | Disposition |
|--------|----|-------------|
| EVIDENCE_OTHER | 2700 | **Stash**（下一轮 CMS/运维证据 · 非本 GO 包） |
| DISCARD_OR_IGNORED | 610 | **Ignore**（`.playwright-browsers`） |
| DOCS_MIXED | 144 | **Stash** |
| MIGRATIONS | 138 | **Restore/clear**（假脏 · 无内容 diff） |
| CODE_NEXT_OR_HOTFIX | 134 | **Stash**（下一版本/功能） |
| SCRIPTS_MIXED | 129 | **Stash** |
| PSG_EVIDENCE | 89 | **Commit**（本周期证据） |
| PSG_GOVERNANCE | 75 | **Commit**（剩余未入库治理面） |
| DRIFT_STATUS_DOCS | 26 | **Commit**（对齐 GO） |
| PSG_ARCHIVE_BASELINE | 18 | **Commit · 入库**（不可变 Archive 首次入 Git） |
| CMS_OR_DATA / OTHER / REPO_META | ~余 | **Stash** 或 ignore |
| DISCARD_WORKTREE / LOGS | 少 | **Ignore** |

## Decisions

1. **Archive 入库：YES** — 首次 `git add` Archive；不改写已有 Archive 内容。  
2. **Matrix GO 入库：YES** — 工作区已 GO、HEAD 仍 NO_GO → 本批提交修正。  
3. **W5：** 已单独 commit `3dc674bd`。  
4. **非 PSG 脏树：** `git stash` 保留，不混入本批。

## Out of scope（下一批）

Staging WC · Real Device · Ambient SLA · Timelock · Production 密钥落地。
