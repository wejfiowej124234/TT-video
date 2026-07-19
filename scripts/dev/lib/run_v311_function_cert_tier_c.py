#!/usr/bin/env python3
"""V311 Function Cert · Tier C mutating runners (real Sepolia txs).

Requires TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 + PRIVATE_KEY.
Does NOT fake PASS. F-02 execute waits Timelock delay (172800s) via state file resume.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
STATE_DIR = ROOT / "evidence" / "GO_phase2_v311_web3_full_function_cert" / "tier_c_state"

ADDR = {
    "ttg": "0x5D2eDABF062E1d8AccDA2bd35c0d9B26CFCd5Ec0",
    "timelock": "0x462402082B395F218FFB3634ec0611e39BdD504C",
    "governor": "0x1ce4fbE80557bC2111A814f60A2334de41032116",
    "p4cap": "0x6A10df057c637A295b48D91A8101d22542425905",
    "primary_market": "0x98a9BCfe967BA27d5448A1569d1622A7938046c2",
    "escrow_factory": "0xbf746B6a330e61416c6D87aB9b0758f7107C8006",
    "fee_router": "0x81A8009210c5215100564c6E4123F672c4459306",
    "usdc": "0x241948bE49a778490c8A4Ae8D98b7537fE001f63",
    "safe": "0x7c018293396325077bb4D039930dcEe11B7Fb1Cf",
}


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_env() -> None:
    # phase2 deploy env wins for chain keys (root .env may have truncated PRIVATE_KEY)
    paths = (
        ROOT / ".env",
        ROOT / "scripts" / "dev" / ".env.phase2-chain-deploy.local",
    )
    for p in paths:
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if not k or not v:
                continue
            # later files overwrite (phase2 last)
            os.environ[k] = v


def _pk() -> str:
    _load_env()
    pk = (os.environ.get("PRIVATE_KEY") or os.environ.get("B417_PRIVATE_KEY") or "").strip()
    if not pk:
        raise RuntimeError("PRIVATE_KEY unset")
    if not pk.startswith("0x"):
        pk = "0x" + pk
    body = pk[2:]
    if len(body) != 64 or any(c not in "0123456789abcdefABCDEF" for c in body):
        raise RuntimeError(f"PRIVATE_KEY malformed (len={len(pk)}); use phase2 deploy env key")
    return pk


def _rpc() -> str:
    cands = [
        os.environ.get("CHAIN_RPC_URL", "").strip(),
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://sepolia.drpc.org",
        "https://rpc.sepolia.org",
    ]
    for c in cands:
        if not c:
            continue
        r = subprocess.run(
            ["cast", "chain-id", "--rpc-url", c],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if r.returncode == 0 and r.stdout.strip() == "11155111":
            return c
    raise RuntimeError("no Sepolia RPC")


def _run(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> subprocess.CompletedProcess[str]:
    e = os.environ.copy()
    if env:
        e.update(env)
    return subprocess.run(
        cmd,
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=e,
    )


def _cast(rpc: str, *args: str) -> str:
    # offline cast subcommands reject --rpc-url
    offline = {"keccak", "sig", "concat-hex", "from-utf8", "to-utf8", "wallet"}
    cmd = ["cast", *args]
    if not args or args[0] not in offline:
        cmd += ["--rpc-url", rpc]
    r = _run(cmd)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "cast failed").strip()[:800])
    return (r.stdout or "").strip()


def _cast_send(rpc: str, pk: str, *args: str) -> str:
    r = _run(["cast", "send", *args, "--rpc-url", rpc, "--private-key", pk, "--json"])
    out = (r.stdout or "") + (r.stderr or "")
    if r.returncode != 0:
        raise RuntimeError(out[-1200:])
    # cast receipt JSON may be large/nested — extract transactionHash first
    m = re.search(r'"transactionHash"\s*:\s*"(0x[0-9a-fA-F]{64})"', out)
    if m:
        return m.group(1)
    m2 = re.search(r"(0x[0-9a-fA-F]{64})", out)
    if m2:
        return m2.group(1)
    raise RuntimeError(f"parse send json: no tx hash; tail={out[-400:]}")


def _addr(pk: str) -> str:
    return _run(["cast", "wallet", "address", "--private-key", pk]).stdout.strip()


def _save_state(item_id: str, payload: dict) -> Path:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    path = STATE_DIR / f"{item_id}.json"
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


def _load_state(item_id: str) -> dict | None:
    path = STATE_DIR / f"{item_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def run_i01_indexer_live() -> dict:
    """Live indexer reconcile — pure Sepolia only (chain_id=11155111)."""
    import urllib.error
    import urllib.request

    _load_env()
    api = (os.environ.get("API_BASE_URL") or os.environ.get("API_BASE") or "http://127.0.0.1:8080").rstrip("/")
    secret = os.environ.get("INTERNAL_API_SECRET", "")
    if not secret:
        return {
            "status": "OWNER_REQUIRED",
            "note": "INTERNAL_API_SECRET unset — cannot call live_reconcile",
            "api_base": api,
        }

    # health
    try:
        with urllib.request.urlopen(f"{api}/health", timeout=5) as resp:
            if resp.status != 200:
                raise RuntimeError(f"health {resp.status}")
    except Exception as e:
        return {
            "status": "OWNER_REQUIRED",
            "note": f"API not reachable at {api}: {e}. Start traveltrust-api with CHAIN_ID=11155111.",
            "api_base": api,
        }

    url = f"{api}/api/v1/internal/indexer-status?live_reconcile=1"
    req = urllib.request.Request(url, headers={"X-Internal-Api-Secret": secret})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8", errors="replace"))
            http = resp.status
    except urllib.error.HTTPError as e:
        return {"status": "FAIL", "api_base": api, "http": e.code, "error": e.reason, "recorded_utc": _utc()}
    except Exception as e:
        return {"status": "FAIL", "api_base": api, "error": str(e), "recorded_utc": _utc()}

    live = body.get("live_orders_projection_reconcile") or {}
    if not isinstance(live, dict):
        return {"status": "FAIL", "api_base": api, "http": http, "error": "missing live_orders_projection_reconcile", "recorded_utc": _utc()}

    # Hard rule: pure Sepolia dataset only
    chain_id = live.get("chain_id") or (live.get("stats") or {}).get("chain_id")
    try:
        chain_i = int(chain_id)
    except Exception:
        chain_i = -1
    if chain_i != 11155111:
        out = {
            "status": "FAIL",
            "machine_key": "TT_V311_INDEXER_LIVE_RECONCILE",
            "api_base": api,
            "http": http,
            "chain_id": chain_i,
            "error": "PURE_SEPOLIA_DATASET_ONLY violated — cert chain_id must be 11155111 (no 31337/seed mix)",
            "live": {
                "ok": live.get("ok"),
                "projection_reconcile_clean": live.get("projection_reconcile_clean"),
                "issues_total": live.get("issues_total"),
                "stats": live.get("stats"),
            },
            "recorded_utc": _utc(),
        }
        _save_state("I-01-indexer-reconcile-live", out)
        return out

    stats = live.get("stats") if isinstance(live.get("stats"), dict) else {}
    raw_issues = live.get("issues_total")
    if raw_issues is None:
        raw_issues = stats.get("issues_total")
    try:
        issues = int(raw_issues) if raw_issues is not None else -1
    except Exception:
        issues = -1
    clean = live.get("projection_reconcile_clean")
    if clean is None:
        clean = stats.get("projection_reconcile_clean")
    clean = bool(clean)
    ok_flag = live.get("ok")
    if ok_flag is None:
        ok_flag = True
    ok = bool(ok_flag) and clean and issues == 0
    out = {
        "status": "PASS" if ok else "FAIL",
        "machine_key": "TT_V311_INDEXER_LIVE_RECONCILE",
        "api_base": api,
        "http": http,
        "chain_id": 11155111,
        "issues_total": issues,
        "projection_reconcile_clean": clean,
        "stats": stats or live.get("stats"),
        "dataset_rule": "PURE_SEPOLIA_ONLY",
        "f02_paused_until_i01_pass": True,
        "recorded_utc": _utc(),
    }
    _save_state("I-01-indexer-reconcile-live", out)
    if ok:
        # machine line for gates
        (STATE_DIR / "TT_V311_INDEXER_LIVE_RECONCILE.txt").write_text(
            "TT_V311_INDEXER_LIVE_RECONCILE: PASS\n", encoding="utf-8"
        )
    else:
        (STATE_DIR / "TT_V311_INDEXER_LIVE_RECONCILE.txt").write_text(
            "TT_V311_INDEXER_LIVE_RECONCILE: FAIL\n", encoding="utf-8"
        )
    return out


def _create_escrow(rpc: str, pk: str, traveler: str, guide: str, amount: int, order_tag: str) -> tuple[str, str, str]:
    """Returns (escrow_addr, order_b32, create_note)."""
    order_b32 = _cast(rpc, "keccak", f"v311-func-cert/{order_tag}/{int(time.time())}")
    snap = _cast(rpc, "keccak", f"v311-func-cert-snap/{order_tag}")
    now = int(time.time())
    env = {
        "PRIVATE_KEY": pk,
        "B407_FACTORY_DEPLOYER_PK": pk,
        "ESCROW_FACTORY_ADDRESS": ADDR["escrow_factory"],
        "B407_ORDER_ID_BYTES32": order_b32,
        "B407_SNAPSHOT_BYTES32": snap,
        "B407_ESCROW_CHAIN_ID": "11155111",
        "B407_TRAVELER": traveler,
        "B407_GUIDE": guide,
        "FEE_ROUTER_ADDRESS": ADDR["fee_router"],
        "B407_FEE_ROUTER": ADDR["fee_router"],
        "PAYMENT_TOKEN": ADDR["usdc"],
        "B407_TOTAL_AMOUNT_WEI": str(amount),
        "B407_PLATFORM_FEE_BPS": "500",  # 5% within V3.1.1 10% max
        "B407_SERVICE_START": str(now),
        "B407_SERVICE_END": str(now + 7 * 86400),
        "B407_DISPUTE_WINDOW_SECONDS": "604800",
        "B407_ESCROW_SCHEMA_VERSION": "1",
        "B407_ARBITRATOR": "0x0000000000000000000000000000000000000000",
        "CHAIN_RPC_URL": rpc,
    }
    r = _run(
        [
            "forge",
            "script",
            "script/CreateEscrowB407.s.sol:CreateEscrowB407",
            "--rpc-url",
            rpc,
            "--broadcast",
            "-vvv",
        ],
        cwd=ROOT / "contracts",
        env=env,
    )
    if r.returncode != 0:
        raise RuntimeError(((r.stdout or "") + (r.stderr or ""))[-1500:])
    escrow = _cast(rpc, "call", ADDR["escrow_factory"], "escrowOf(bytes32)(address)", order_b32).split()[0]
    if escrow.lower() in ("", "0x0000000000000000000000000000000000000000"):
        raise RuntimeError("escrowOf empty after create")
    return escrow, order_b32, ((r.stdout or "") + (r.stderr or ""))[-800:]


def run_f01_escrow_lifecycle(rpc: str | None = None) -> dict:
    """create → deposit → (release | refund | openDispute) on three small escrows."""
    prior = _load_state("F-01-escrow-lifecycle")
    if prior and prior.get("status") == "PASS" and prior.get("txs", {}).get("paths"):
        return {**prior, "resumed_from_state": True, "recorded_utc": prior.get("recorded_utc") or _utc()}
    _load_env()
    try:
        pk = _pk()
    except RuntimeError as e:
        return {"status": "OWNER_REQUIRED", "note": str(e)}
    rpc = rpc or _rpc()
    traveler = _addr(pk)

    # ephemeral guide (cast wallet new text format; do not persist guide_pk in evidence)
    w = _run(["cast", "wallet", "new"])
    blob = (w.stdout or "") + (w.stderr or "")
    if w.returncode != 0:
        return {"status": "FAIL", "error": "cast wallet new failed", "tail": blob[-400:]}
    am = re.search(r"Address:\s*(0x[0-9a-fA-F]{40})", blob)
    pm = re.search(r"Private key:\s*(0x[0-9a-fA-F]{64})", blob)
    if not am or not pm:
        return {"status": "FAIL", "error": "guide wallet parse failed", "raw": blob[-400:]}
    guide = am.group(1)
    guide_pk = pm.group(1)
    _ = guide_pk  # kept only for optional future signed guide txs; release() is permissionless

    txs: dict = {"traveler": traveler, "guide": guide, "paths": {}}
    amount = int(os.environ.get("TT_V311_F01_AMOUNT_USDC_UNITS", "1000000"))  # 1 USDC

    try:
        # fund guide dust ETH for potential future use
        fund_tx = _cast_send(rpc, pk, guide, "--value", "0.005ether")
        txs["guide_fund_tx"] = fund_tx

        for path in ("release", "refund", "dispute"):
            escrow, order_b32, _note = _create_escrow(rpc, pk, traveler, guide, amount, path)
            approve_tx = _cast_send(rpc, pk, ADDR["usdc"], "approve(address,uint256)", escrow, str(amount))
            deposit_tx = _cast_send(rpc, pk, escrow, "deposit(uint256)", str(amount))
            st = _cast(rpc, "call", escrow, "status()(uint8)").split()[0]
            if st not in ("2", "2["):
                raise RuntimeError(f"{path}: expected Funded(2) got {st}")

            path_detail = {
                "escrow": escrow,
                "order_id": order_b32,
                "approve_tx": approve_tx,
                "deposit_tx": deposit_tx,
                "amount_usdc_units": amount,
            }
            if path == "release":
                path_detail["release_tx"] = _cast_send(rpc, pk, escrow, "release()")
            elif path == "refund":
                path_detail["refund_tx"] = _cast_send(rpc, pk, escrow, "refund()")
            else:
                reason = _cast(rpc, "keccak", "v311-func-cert-dispute")
                path_detail["dispute_tx"] = _cast_send(rpc, pk, escrow, "openDispute(bytes32)", reason)
            final = _cast(rpc, "call", escrow, "status()(uint8)").split()[0]
            path_detail["final_status"] = final
            txs["paths"][path] = path_detail

        # expect Completed=3, Refunded=4, Disputed=5
        expect = {"release": "3", "refund": "4", "dispute": "5"}
        bad = [k for k, v in expect.items() if not str(txs["paths"][k]["final_status"]).startswith(v)]
        if bad:
            return {"status": "FAIL", "error": f"unexpected final status for {bad}", "txs": txs, "recorded_utc": _utc()}
        out = {
            "status": "PASS",
            "title": "Escrow create/pay/release/refund/dispute",
            "factory": ADDR["escrow_factory"],
            "fee_router": ADDR["fee_router"],
            "usdc": ADDR["usdc"],
            "txs": txs,
            "recorded_utc": _utc(),
        }
        _save_state("F-01-escrow-lifecycle", out)
        return out
    except Exception as e:
        return {"status": "FAIL", "error": str(e)[:1500], "txs": txs, "recorded_utc": _utc()}


def run_f02_gov_timelock(rpc: str | None = None) -> dict:
    """propose → vote → Succeeded → queue(schedule) → execute (after delay)."""
    _load_env()
    try:
        pk = _pk()
    except RuntimeError as e:
        return {"status": "OWNER_REQUIRED", "note": str(e)}
    rpc = rpc or _rpc()
    gov = ADDR["governor"]
    ttg = ADDR["ttg"]
    tl = ADDR["timelock"]
    eoa = _addr(pk)
    state = _load_state("F-02-gov-timelock") or {}

    try:
        # Resume execute if queued
        if state.get("phase") == "queued" and state.get("proposal_id"):
            pid = str(state["proposal_id"])
            st = _cast(rpc, "call", gov, "state(uint256)(uint8)", pid).split()[0]
            op_id = state.get("op_id")
            ready_at = int(state.get("execute_after_unix") or 0)
            now = int(time.time())
            # OZ Governor ProposalState:
            # Pending=0 Active=1 Canceled=2 Defeated=3 Succeeded=4 Queued=5 Expired=6 Executed=7
            st_i = int(st.split("[")[0])
            if st_i == 5:  # Queued — try execute after ETA
                if now < ready_at:
                    return {
                        "status": "OWNER_REQUIRED",
                        "phase": "queued_waiting_delay",
                        "proposal_id": pid,
                        "op_id": op_id,
                        "execute_after_unix": ready_at,
                        "seconds_remaining": ready_at - now,
                        "timelock_delay_s": 172800,
                        "note": "Timelock delay 172800s — re-run after ETA with BROADCAST_OK=1 to execute",
                        "upgrade_authority": f"Safe({ADDR['safe']})→Timelock({tl})→upgradeTo",
                        "recorded_utc": _utc(),
                        **{k: state.get(k) for k in ("propose_tx", "vote_tx", "queue_tx") if state.get(k)},
                    }
                exec_tx = _cast_send(rpc, pk, gov, "execute(uint256)", pid)
                st2 = _cast(rpc, "call", gov, "state(uint256)(uint8)", pid).split()[0]
                st2_i = int(st2.split("[")[0])
                out = {
                    "status": "PASS" if st2_i == 7 else "FAIL",
                    "phase": "executed",
                    "proposal_id": pid,
                    "op_id": op_id,
                    "execute_tx": exec_tx,
                    "final_state": st2,
                    "final_state_int": st2_i,
                    "propose_tx": state.get("propose_tx"),
                    "vote_tx": state.get("vote_tx"),
                    "queue_tx": state.get("queue_tx"),
                    "timelock": tl,
                    "safe_timelock_path": f"Safe({ADDR['safe']})→Timelock({tl})",
                    "recorded_utc": _utc(),
                }
                _save_state("F-02-gov-timelock", out)
                return out
            if st_i == 7:  # Executed
                out = {
                    **state,
                    "status": "PASS",
                    "phase": "executed",
                    "final_state": st,
                    "final_state_int": 7,
                    "recorded_utc": _utc(),
                }
                _save_state("F-02-gov-timelock", out)
                return out
            if st_i == 6:  # Expired — do not claim PASS
                return {
                    "status": "FAIL",
                    "phase": "expired",
                    "proposal_id": pid,
                    "final_state": st,
                    "note": "Proposal Expired (state=6) — reopen Governance path; not Executed",
                    "recorded_utc": _utc(),
                }

        # Fund Timelock with TTG for transfer(1) payload
        _cast_send(rpc, pk, ttg, "transfer(address,uint256)", tl, "10000000000000000")

        env = {
            "PRIVATE_KEY": pk,
            "GOVERNOR_ADDRESS": gov,
            "GOVERNANCE_TOKEN_ADDRESS": ttg,
            "GOVERNANCE_VOTES_TOKEN_ADDRESS": ttg,
            "CHAIN_RPC_URL": rpc,
        }
        r = _run(
            [
                "forge",
                "script",
                "script/SepoliaProposeMinimal.s.sol:SepoliaProposeMinimal",
                "--rpc-url",
                rpc,
                "--broadcast",
                "-vvv",
            ],
            cwd=ROOT / "contracts",
            env=env,
        )
        blob = (r.stdout or "") + (r.stderr or "")
        if r.returncode != 0:
            return {"status": "FAIL", "phase": "propose", "error": blob[-1500:], "recorded_utc": _utc()}
        m = re.search(r"proposalId\s+(\d+)", blob)
        if not m:
            # fallback: proposalCount
            pid = _cast(rpc, "call", gov, "proposalCount()(uint256)").split()[0]
        else:
            pid = m.group(1)

        # wait voteStart (votingDelayBlocks=1)
        time.sleep(20)
        vote_tx = _cast_send(rpc, pk, gov, "castVote(uint256,uint8)", pid, "1")  # For=1

        # wait voteEnd (votingPeriodBlocks=20 ≈ 240s on Sepolia)
        deadline = time.time() + 420
        st_i = -1
        while time.time() < deadline:
            time.sleep(15)
            st = _cast(rpc, "call", gov, "state(uint256)(uint8)", pid).split()[0]
            st_i = int(st.split("[")[0])
            if st_i in (3, 4, 5, 6):  # Defeated / Succeeded / Queued / Executed
                break
        if st_i != 4:
            out = {
                "status": "OWNER_REQUIRED",
                "phase": "awaiting_succeeded",
                "proposal_id": pid,
                "state": st_i,
                "vote_tx": vote_tx,
                "note": "Wait for votingPeriod then re-run (state must be 4 Succeeded before queue)",
                "recorded_utc": _utc(),
            }
            _save_state("F-02-gov-timelock", out)
            return out

        queue_tx = _cast_send(rpc, pk, gov, "queue(uint256)", pid)
        op_id = _cast(rpc, "call", gov, "proposals(uint256)((address,uint256,uint256,uint256,uint256,uint256,bool,bool,bytes32))", pid)
        # read queuedOpId via proposals struct — fragile; use state file + operations
        # Prefer: get from receipt logs; fallback compute hash
        delay = int(_cast(rpc, "call", tl, "delay()(uint256)").split()[0])
        execute_after = int(time.time()) + delay
        # extract op id from governor storage call simpler:
        # cast call proposals — parse last bytes32 field
        prop_raw = _cast(rpc, "call", gov, "getProposalActions(uint256)", pid)
        out = {
            "status": "OWNER_REQUIRED",
            "phase": "queued",
            "proposal_id": pid,
            "vote_tx": vote_tx,
            "queue_tx": queue_tx,
            "execute_after_unix": execute_after,
            "timelock_delay_s": delay,
            "seconds_remaining": delay,
            "note": f"Queued on Timelock — execute after {delay}s (ETA unix {execute_after}). Re-run with BROADCAST_OK=1.",
            "safe_timelock_path": f"Safe({ADDR['safe']})→Timelock({tl})→execute",
            "upgrade_authority_note": "Proxy upgrades: Safe→Timelock→upgradeTo (EIP-1967 Transparent-style)",
            "actions_raw": prop_raw[:200],
            "recorded_utc": _utc(),
        }
        # try read queuedOpId
        try:
            # TravelTrustGovernor.proposals public — returns tuple; queuedOpId last
            raw = subprocess.run(
                ["cast", "call", gov, "proposals(uint256)(address,uint256,uint256,uint256,uint256,uint256,bool,bool,bytes32)", pid, "--rpc-url", rpc],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            lines = [ln.strip() for ln in (raw.stdout or "").splitlines() if ln.strip()]
            if lines:
                out["op_id"] = lines[-1].split()[0]
        except Exception:
            pass
        _save_state("F-02-gov-timelock", out)
        return out
    except Exception as e:
        return {"status": "FAIL", "error": str(e)[:1500], "recorded_utc": _utc(), "partial": state}


def run_f03_treasury_flow(rpc: str | None = None) -> dict:
    """PrimaryMarket.purchase → USDC to P4Cap sink (real treasury inbound)."""
    prior = _load_state("F-03-treasury-flow-tx")
    if prior and prior.get("status") == "PASS" and prior.get("purchase_tx"):
        return {**prior, "resumed_from_state": True, "recorded_utc": prior.get("recorded_utc") or _utc()}
    _load_env()
    try:
        pk = _pk()
    except RuntimeError as e:
        return {"status": "OWNER_REQUIRED", "note": str(e)}
    rpc = rpc or _rpc()
    pm = ADDR["primary_market"]
    usdc = ADDR["usdc"]
    p4 = ADDR["p4cap"]
    eoa = _addr(pk)
    amount = int(os.environ.get("TT_V311_F03_USDC_UNITS", "100000000"))  # 100 USDC min

    try:
        sink = _cast(rpc, "call", pm, "usdcTreasury()(address)").split()[0]
        if sink.lower() != p4.lower():
            return {"status": "FAIL", "error": f"usdcTreasury {sink} != P4Cap {p4}"}

        bal_before = int(_cast(rpc, "call", usdc, "balanceOf(address)(uint256)", p4).split()[0], 0)
        eoa_usdc = int(_cast(rpc, "call", usdc, "balanceOf(address)(uint256)", eoa).split()[0], 0)
        if eoa_usdc < amount:
            return {
                "status": "OWNER_REQUIRED",
                "note": f"EOA USDC {eoa_usdc} < min purchase {amount}",
                "eoa": eoa,
            }

        approve_tx = _cast_send(rpc, pk, usdc, "approve(address,uint256)", pm, str(amount))
        purchase_tx = _cast_send(rpc, pk, pm, "purchase(uint8,uint256)", "0", str(amount))
        bal_after = int(_cast(rpc, "call", usdc, "balanceOf(address)(uint256)", p4).split()[0], 0)
        delta = bal_after - bal_before
        ok = delta >= amount
        out = {
            "status": "PASS" if ok else "FAIL",
            "title": "Treasury flow real txs (PM purchase → P4Cap USDC sink)",
            "primary_market": pm,
            "usdc_sink_p4cap": p4,
            "buyer": eoa,
            "usdc_amount": amount,
            "approve_tx": approve_tx,
            "purchase_tx": purchase_tx,
            "p4cap_usdc_before": bal_before,
            "p4cap_usdc_after": bal_after,
            "p4cap_usdc_delta": delta,
            "recorded_utc": _utc(),
        }
        _save_state("F-03-treasury-flow-tx", out)
        return out
    except Exception as e:
        return {"status": "FAIL", "error": str(e)[:1500], "recorded_utc": _utc()}


def run_tier_c_item(item_id: str, rpc: str | None = None) -> dict:
    if item_id == "I-01-indexer-reconcile-live":
        return run_i01_indexer_live()
    if item_id == "F-01-escrow-lifecycle":
        return run_f01_escrow_lifecycle(rpc)
    if item_id == "F-02-gov-timelock":
        return run_f02_gov_timelock(rpc)
    if item_id == "F-03-treasury-flow-tx":
        return run_f03_treasury_flow(rpc)
    return {"status": "FAIL", "error": f"unknown item {item_id}"}
