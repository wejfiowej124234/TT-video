# Owner Self Review · Checklist Template（PSG Solo）

**SSOT:** [TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)  
**Use:** Hotfix · Patch · Feature · formal Release prep（非 Archive 字节）

```markdown
## Owner Self Review
- Date (UTC): ________
- Owner: ________
- Change class: Hotfix | Patch | Feature | New Release cycle
- Branch from: v1.1.0-psg-go.20260717 | other Freeze id: ________
- Summary: ________

### Gates / Evidence
- [ ] Gate(s): ________ · exit 0
- [ ] Evidence path(s): ________
- [ ] Did not mutate release_archive/v1.1.0-psg-go.20260717/
- [ ] Did not re-run PASS Gates only to refresh frozen baseline

### W5 · Time-separated recheck (formal Release / GO only · REQUIRED)
- [ ] Self Review session ended (not same continuous session as Sign-off)
- [ ] Independent recheck performed after a break
- [ ] Re-confirmed: Gates · Evidence · Release Note/Baseline · Archive consistency
- Recheck Date (UTC): ________

### Sign-off (if release / GO class · ONLY after W5)
- [ ] Owner Sign-off attached (name + signed_utc + decision)
- [ ] If new formal release: new freeze_manifest_id + Release Archive planned

### Decision
- [ ] READY TO COMMIT / INTEGRATE
- [ ] HOLD — reason: ________
```

**≠ peer Code Review · ≠ second Approver.**  
正式 Release：**W5 时间隔离复检** 替代第二双眼睛。
