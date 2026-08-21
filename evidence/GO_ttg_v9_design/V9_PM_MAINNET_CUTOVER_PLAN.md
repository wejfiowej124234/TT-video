# V9 PM Mainnet Cutover Plan (pre-broadcast)

**Phase:** ③ planning · READ-ONLY complete · broadcast **HOLD**  
**Hard:** No Agent signing · Money Path KEEP · no `TT_PRODUCTION_GO` flip

## 0 · Before Owner broadcast auth

1. Close MIGRATE-01 (Owner A/B/C/D).  
2. Exact Match OLD PM bytecode vs fusion source (or document drift).  
3. Only then prepare unsigned Timelock payloads.  
4. Do **not** set Mainnet cutover OK env this wave.

## 1 · Inventory migrate (only after MIGRATE-01)

1. Deploy Vault + Batch PM · `usdcTreasury = P4Cap` · Timelock(+Guardian).  
2. Move 12.5T OLD PM → Vault via proven exit.  
3. Check: OLD bal=0 · Vault=12.5T · supply=25T.  
4. `seedBatchesFromNorm()` · batch1 closed until Norm start.  
5. Do not leave `/meta` on OLD after move.

If MIGRATE-01 open: **STOP** · no empty-Vault “live sale” · no remint.

## 2 · OLD PM retire order

R0 Reality snapshot (done) → R1 close MIGRATE-01 → R2 migrate → R3 disable purchase (needs pause/upgrade **or** bal=0) → R4 `/meta`+www same-day pin → R5 registry LEGACY stamp → R6 48h no Purchased on OLD.

Done when: OLD TTG=0 **and** `/meta.primary_market_address` ≠ `0x882Ad…`.

## 3 · `/meta` + www same-day pin

Same UTC day: (1) chain live+migrated (2) `/meta` primary_market→V9 PM (3) www Norm quote/unlock (4) evidence.  
Until pin: www V9 copy vs `/meta` V8 PM = Expected Difference.  
Do **not** change token/gov/TL/P4Cap/Money Path `/meta` keys this cutover.

## 4 · Rollback / STOP

| Trigger | Action |
|---------|--------|
| MIGRATE-01 open | STOP |
| Inventory checksum fail | STOP · no `/meta` flip |
| Supply ≠ 25T | STOP |
| V9 treasury ≠ P4Cap | STOP |
| Money Path drift | STOP |
| `/meta` flipped + Vault empty | ROLLBACK `/meta` to OLD |
| Key exposure / Agent sign request | STOP · rotate |

Chain deploy is append-only; disclosure rollback = `/meta`/www. If inventory already moved: Timelock pause V9 + freeze disclosure.

## 5 · Next gate

Owner written MIGRATE-01 decision → **separate** broadcast auth session.
