# TT · W0 Runtime Alignment · Acceptance Checklist（WAIT_ETA · PREP ONLY）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_W0_RUNTIME_ALIGNMENT_CHECKLIST`  
**Status:** `SUPERSEDED_SNAPSHOT` · `PREPARED_NOT_EXECUTED` · **禁止本窗 Deploy**  
**Recorded:** `2026-07-20`  
**执行闸：** Formal Baseline **之后** · Reality Closure **入口**  
**Planning：** [TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md)  
**Live 旁证：** [Staging Old-Runtime Multi-Dim](./TT-STAGING-OLD-RUNTIME-MULTI-DIM-CHECKLIST-LATEST.md)

```text
W0 = 消旧系统 · 不是重做功能
车辆：PCR → Version Gate → Deploy Identity → Runtime Certification → 新证据根
禁止：裸 fly deploy · 等窗执行 · 用旧 Evidence 证新 Runtime
```

---

## 1 · 对拍表（当前 → 目标）

| 项 | 当前（Staging live） | 目标（Candidate tip） | 验收证据 |
|----|----------------------|------------------------|----------|
| **API SHA** | `f8181b63…` | `652bbab5…` | `/meta`.build.git_sha = tip |
| **Web SHA** | unknown（HTTP 200 · 无公开字段） | = Candidate / tip | Deploy Identity · 构建标签或等价 |
| **Worker** | unknown | = Candidate | Deploy Identity |
| **EscrowFactoryV2** | `null` | `0x6e9a4c40…bdef`（Money Path） | `/meta` 投影 = Candidate |
| **SettlementRouter** | 缺失 | `0x5A6df184…4d6A` | `/meta` 有键且地址对 |
| **FeeRouter** | `0x81A80092…9306`（旧） | `0xf406e6f1…0ab28` | 地址 = Candidate |
| **Treasury** | `null` | Candidate / Owner 策略明确 | `/meta` 或书面槽位 |
| **Timelock** | `0x46240208…504c`（已对齐） | 保持 | 回归不回漂 |
| **Indexer checkpoint** | `0 / 0` | synced / 可解释进度 | `/meta`.indexer + 烟测 |
| **chain_id** | `11155111` | `11155111`（②） | 不变 |
| **Migration attest** | `/meta` 无 hash | tip checksum 已应用 | Schema attest 附录 |
| **Deploy Identity** | `deployed_at=null` 弱 | Version Gate PASS 包 | 新证据根 |

---

## 2 · 微梯子（满窗后勾选）

- [ ] Formal Baseline 已钉  
- [ ] PCR `PCR-STAGING-ALIGN-CAND-V2` 开单  
- [ ] Version Gate PASS  
- [ ] Deploy Identity（API+Web+Worker）  
- [ ] Staging `/meta` SHA = tip  
- [ ] 合约投影对拍表全 PASS（或 Owner 书面差异）  
- [ ] Indexer 非假绿（checkpoint 可解释）  
- [ ] Runtime Certification 写入 **新** `evidence/PSG-REALITY-CLOSURE/W0-*/`  
- [ ] **禁止**引用 FG-15-B / 旧 Archive 证本 Runtime  
- [ ] 解锁 W1+（仍禁止裸测旧 API）

---

## 3 · 诚实边界

```text
本表 PREPARED ≠ W0 已执行 ≠ 可 redeploy
填绿勾选仅 Formal Baseline 后
W0 PASS ≠ Auth/CMS READY ≠ Reality Closure PASS
```
