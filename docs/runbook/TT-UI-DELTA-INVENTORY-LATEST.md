# TT · UI Delta Inventory（SSOT 校验基线 · RC `3b310ca8`）

**Machine key:** `TT_UI_DELTA_INVENTORY`  
**Status:** `BASELINE_ACTIVE` · **≠** Inventory Feature Matrix · **≠** Reality Closure · **≠** GO  
**RC tip（产品真源）:** `3b310ca856ce2850b37a6f993f8c5649e87903b1`  
**Prior FROZEN RC:** `1ed03a9a959d2404fd561a72dc724b59ecf1635e`（祖先保留）  
**Staging Web tip:** PENDING clean bake @ `3b310ca8`  
**Pin:** `PSG-REL-20260720-WEB3-CAND-V2`  
**JSON:** [`TT-UI-DELTA-INVENTORY-LATEST.json`](./TT-UI-DELTA-INVENTORY-LATEST.json)  
**Freeze PCR:** `PCR-20260722-UI-DELTA-P1-05-06-07-FREEZE`  
**Gate discipline:** Engineering SSOT Anchor → Git RC tip → Staging Runtime → Delta Freeze

---

## 0 · 铁律

```text
× reset / revert / 覆盖旧 Delta
× 丢弃祖先 tip（1b622923 / f9c227de / 6b85bde9 / 1ed03a9a / 3b310ca8）
× dirty bake Staging Web
× 放宽后端 participant / admin ACL
× 用 ① 绿冒充 ②③ GO
```

**继承校验：** 任意新 Delta 合并前，本清单 `must_retain[]` 机读项必须仍为 PASS。

---

## 1 · 必须保留的已入库 Delta（must_retain）

| ID | tip | 范围 | 机读锚 |
|----|-----|------|--------|
| D-HOME-AI | `1b622923` | `/` AI 行程 `previewLocked` / `aiGenerateCommitted` | `landingAiItineraryFormReady.ts` |
| D-CINEMA | `f9c227de` | L5 角色影院 overlay · Owner promo | cinema/promo SSOT + locales |
| D-ACL-MARKET | `6b85bde9` | Market Drawer/Card Escrow/Pay 参与方闸 | `participantReadOk` · `data-tt-market-card-own-*` |
| D-ACL-ESCROW | `6b85bde9` | Escrow 401→login · 403 清 prefetch | `applyOrderGetFailure` · `loadErrorKind` |
| D-UNLOCK | `1ed03a9a` | Unlock 诚实徽章 · 非支付文案 | `unlock_honesty_badge` |
| D-GOV-VOTE | `1ed03a9a` | 链下投票 `can_cast_vote` 闸 | `data-tt-gov-offchain-vote-gated` |
| D-ADMIN-WRITE | `3b310ca8` | Admin Users 写 CTA capability 闸 | `data-tt-admin-users-write-gate` |
| D-COMM-SHOWCASE | `3b310ca8` | 关系链可见诚实条 · demo 加友闸 | `data-tt-community-relational-showcase` · `data-tt-community-friends-showcase-add-gated` |
| D-STUDIO-GATE | `3b310ca8` | Acquisition/Provider Studio 发布就绪闸 | `data-tt-market-subsite-studio-gated` · `studioEligible` |
| D-RC | `3b310ca8` | 上表合并为单一 RC | 祖先含 `1ed03a9a` / `6b85bde9` |

**社媒 / 收购角标 / 首页交互：** 以现行 `frontend/` + 对应 evidence/SSOT 为准；本清单禁止删改回流。

---

## 2 · Audit 闭环状态

| ID | 状态 | 落点 |
|----|------|------|
| P0-01/02/03 | ✅ CLOSED | tip `6b85bde9` @ Staging |
| P1-01/02/03/04 | ✅ CLOSED | tip `1ed03a9a` @ Staging |
| P1-05 Admin write gate | ✅ CLOSED · PENDING bake | tip `3b310ca8` |
| P1-06 Community showcase honesty | ✅ CLOSED · PENDING bake | tip `3b310ca8` |
| P1-07 Acquisition studio precheck | ✅ CLOSED · PENDING bake | tip `3b310ca8` |

---

## 3 · 发布阶梯（写死）

```text
1) 产品 commit（仅 frontend 修复；祖先 Delta 不得丢失）  ✅ 3b310ca8
2) Engineering SSOT Anchor tip ← 新产品 tip               ← 本批
3) clean tip worktree Staging Web bake
4) Delta dry-run P0=0
5) FINAL RELEASE re-FROZEN + PCR align
6) 才可开下一组 P1/P2 或 Inventory
```

---

## 4 · 诚实边界

本清单 ≠ Feature Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO。
