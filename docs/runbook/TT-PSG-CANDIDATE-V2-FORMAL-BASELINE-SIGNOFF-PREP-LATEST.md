# Project A · Formal Baseline 签核材料（PREPARED · 未签）

**Status:** `PREPARED_NOT_SIGNED`  
**Pin:** `PSG-REL-20260720-WEB3-CAND-V2`  
**Baseline:** `v311_fund_safety_candidate_v2`  
**Signer name SSOT:** Sebastian Ward（塞巴斯蒂安·沃德）  
**禁止：** 现在 Sign-off · 现在写 `signed=true` · Hard Gate · Wave · Production GO

---

## 1 · 建议 Baseline 名称（草案 · 待 S7 后锁定）

| 项 | 草案 |
|----|------|
| **Release / Baseline 名** | `v1.1.x-psg-cand-v2.<YYYYMMDD>`（S7 当日填日期） |
| **Active pin（现行）** | `PSG-REL-20260720-WEB3-CAND-V2` |
| **Deploy** | `v311_fund_safety_candidate_v2` |
| **Archive** | **新建** Release Archive（禁止改写 `v1.1.0-psg-go.20260717`） |

---

## 2 · Release note 骨架（S7 后填数）

```text
Title: TravelTrust PSG Candidate v2 Formal Baseline (draft)

What closed:
- FG-15-B ELAPSED
- Settlement finalize + Capture
- Bridge A + S7 input gates READY
- L5 Final + S7 Recalculate verdict

What did NOT close:
- Production GO / Hard Gate / real ETH Wave
- Founder wallet mainnet binding (separate OWNER_INPUT)
- Licensed legal counsel review

Honesty:
psg_complete / Formal Baseline / Production GO 三者分离
```

---

## 3 · Owner Self Review checklist（满窗前可勾准备项）

- [ ] ETA Gate = READY_TO_EXECUTE（墙钟）
- [ ] finalize 收据齐全
- [ ] Bridge A 物化（非 POINTER 拷贝）
- [ ] Manifest AFTER + verify-pre-s7 READY
- [ ] Baseline Gate READY · Source Check READY
- [ ] FG Capture / L5 Final 落盘
- [ ] S7 报告已生成（`PSG-FINAL-RECALCULATE-REPORT`）
- [ ] 残差桶已读（Owner 项 vs 接受项）
- [ ] **未**同会话 Sign-off

---

## 4 · Owner Sign-off checklist（仅 W5 后）

- [ ] Self Review 与 Sign-off **时间隔离**（W5）
- [ ] 独立复检：Gates · Evidence · Note · Archive 意图
- [ ] Signer = Sebastian Ward（塞巴斯蒂安·沃德）
- [ ] `signed=true` 仅写在**新** stamp（禁止改 DRAFT prep）
- [ ] Formal Baseline / Archive 路径已定
- [ ] 明确：本签 **≠** Production GO

---

## 5 · 签名块（现在留空 · 满窗+W5 后填）

```text
Signer: Sebastian Ward（塞巴斯蒂安·沃德）
Self Review UTC: ____________________
Sign-off UTC:    ____________________   ← 必须晚于 Self Review
Signature:       ____________________
Verdict:         FORMAL_BASELINE_READY | BLOCKED | NEEDS_OWNER
```

**记录：** PREPARED only · `signed=false`
