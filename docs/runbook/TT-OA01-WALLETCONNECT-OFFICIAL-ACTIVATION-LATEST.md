# OA-01 · WALLETCONNECT_OFFICIAL_ACTIVATION（LATEST）

**STATUS:** `BAKE_CLOSED_REALITY_QR_PASS` · **Stamp:** `2026-08-15T12:50:00Z`  
**Bake regression:** `WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` = **CLOSED_REALITY**  
**Sole WC blocker:** NO (bake hole closed) · **UI:** keep existing Wallet Sheet · **NO_GO**

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**  
> **本 hop 身份（历史 · 不改写）：** Official live FE `2ba08bd4` / API `80eed10f` = WC bake CLOSED_REALITY hop。活面真源是上方 www pin。

## Machine

| Item | Value |
|------|-------|
| Official live FE (hop identity) | `2ba08bd4ea4f018e71abd37fc76a9763c9cc8fb8` · `build_time=2026-08-15T12:39:51Z` · **SUPERSEDED as living Official product** by **OPS-2026.08.20-v9** (`3e356617`; historical www pin `daa5ae87` SUPERSEDED) |
| Prior Official FE | `a6efa351` (ARG hole) |
| Official build.env.local | `KEY_PRESENT` · masked `2b29…8926` |
| Bundle / wagmi / Sheet / QR | Project ID inlined · WalletConnect connector · **no**「未配置」· **real QR** |
| API (hop kept) | `80eed10f` kept · living Official API `8df2ab21` |

## Bake delta only

`Dockerfile.fly-staging` `ARG`/`ENV` + Official `CHAIN_ID=1` non-empty 32-hex RUN. Source still `process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. No Header/Community/CMS/Session/BFF/Web3 product delta.

Evidence: `evidence/GO_oa01_walletconnect_official_bake/`

## Owner steps remaining (not this regression)

1. 桌面 QR → 手机扫码 → Deep Link/回流 → chainId=1 / address / session 边界
2. 补齐 WC：refresh · reject · wrong-chain · zero-value sign UI
3. 9/9 PASS → `node scripts/dev/seal-wc-real-device-1-from-owner-marks.cjs`

## Forbidden

- 重做钱包 Sheet / UX 架构
- 浏览器扩展冒充 Mobile PASS
- Git 提交 Project ID / `.env*`
- Track1 / Indexer / Cert 重跑 · FTB/Mainnet 改 · FeeRouter/Track2/83 · 发 USDC/TTG
- 自动翻转 `TT_PRODUCTION_GO` · 进入 Phase 2B

*Sebastian Ward · Solo · OA-01 Official bake CLOSED_REALITY · NO_GO*
