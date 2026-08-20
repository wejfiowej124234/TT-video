#!/usr/bin/env python3
"""Official www product-surface isolation (machine gate).

Stops Web3/ABI work from rebuilding https://www.web3-ttg.com from a dirty
frontend tree. Identity SHA is not product bytes.

Bake classes:
  full          — whole Next app. Forbidden while freeze status is FROZEN
                  unless TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK=1.
  web3_overlay  — allowlisted Web3 files only. Forbidden unless
                  TT_OFFICIAL_WEB3_OVERLAY_UNLOCK=1. Dirty product paths fail.
  restore_image — fly deploy --image of restore_handle. No rebuild.
                  Actual fly requires TT_OFFICIAL_WWW_RESTORE_PIN=1.

TT_SKIP_OFFICIAL_BASELINE_PIN=1 does NOT skip this gate.
"""
from __future__ import annotations

import argparse
import json
import os
import posixpath
import subprocess
import sys
from pathlib import Path
from typing import Iterable

PIN_REL = "docs/runbook/TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json"
# Living Official = OPS-2026.08.20-v9 (must match freeze JSON live.*).
# SUPERSEDED: M07 overlay 2551fafd / …-v9-m07-unlock · prior OPS-20260820 …-v8 · 08-16 daa5ae87
PIN_GIT_SHA = "3e356617a498b0faac42e4ae457343d36294a770"
PIN_BUILD_TIME = "2026-08-20T00:51:57Z"
PIN_IMAGE_TAG = "hybrid-live-auth-pin-nontarget-v9-20260820"

# Docker context is frontend/ (fly.production.toml). These prefixes are
# product UI and must not ride along on a Web3 bake.
PRODUCT_PREFIXES = (
    "frontend/components/traveltrust/",
    "frontend/components/ugc/",
    "frontend/locales/",
    "frontend/app/(home)/",
    "frontend/app/traveltrust/",
    "frontend/app/market/",
    "frontend/app/did-rank/",
    "frontend/app/community/",
    "frontend/app/admin/",
    "frontend/app/provider/register/",
    "frontend/app/auth/login/",
    "frontend/app/auth/register/",
)

PRODUCT_EXACT = (
    "frontend/components/traveltrust/cinematic/TravelTrustAnnouncementsPage.tsx",
    "frontend/components/traveltrust/cinematic/TravelTrustPulseTicker.tsx",
)

# Files that may change in web3_overlay class. Keep narrow.
ALLOWLIST_PREFIXES = (
    "contracts/abi/",
    "frontend/dapp/abis/",
)
ALLOWLIST_EXACT = (
    "frontend/lib/escrowFactoryEnv.ts",
    "frontend/lib/governance/primaryMarketRuntimePriceSsot.ts",
    "deploy/fly/tt-web-prod/build.env.local",
    "frontend/.env.mainnet.local",
    "frontend/public/tt-release-identity.bake.json",
)

FORBIDDEN_WORKTREE_MARKERS = (
    "ugc-translate",
    "batch-a-session",
    "r-comm-identity",
)
ALLOWED_OVERLAY_WORKTREE = "official-www-web3-overlay"

# Porcelain noise that cannot enter the frontend Docker context.
IGNORE_PORCELAIN_PREFIXES = (
    "docs/",
    "evidence/",
    ".tmp_agent/",
    ".tmp-",
    ".cursor/",
    "agent-transcripts/",
    "release_archive/",
)


def fail(msg: str, code: int = 2) -> None:
    print(f"FAIL: official-www-product-surface: {msg}", file=sys.stderr)
    raise SystemExit(code)


def ok(msg: str) -> None:
    print(f"PASS: official-www-product-surface: {msg}")


def norm_path(p: str) -> str:
    s = p.strip().strip('"').replace("\\", "/")
    while s.startswith("./"):
        s = s[2:]
    return posixpath.normpath(s)


def load_pin(pin_path: Path) -> dict:
    if not pin_path.is_file():
        fail(f"missing pin SSOT {pin_path}")
    data = json.loads(pin_path.read_text(encoding="utf-8"))
    live = data.get("live") or {}
    sha = str(live.get("git_sha") or "").strip()
    if sha != PIN_GIT_SHA:
        fail(f"pin git_sha={sha!r} != Owner pin {PIN_GIT_SHA}")
    return data


def is_product_path(rel: str) -> bool:
    p = norm_path(rel)
    if p in PRODUCT_EXACT:
        return True
    return any(p == pre[:-1] or p.startswith(pre) for pre in PRODUCT_PREFIXES)


def is_allowlist_path(rel: str) -> bool:
    p = norm_path(rel)
    if p in ALLOWLIST_EXACT:
        return True
    return any(p == pre[:-1] or p.startswith(pre) for pre in ALLOWLIST_PREFIXES)


def ignore_porcelain_path(rel: str) -> bool:
    p = norm_path(rel)
    return any(p == pre[:-1] or p.startswith(pre) for pre in IGNORE_PORCELAIN_PREFIXES)


def frontend_bake_path(rel: str) -> bool:
    """True if Docker COPY . ./ (context=frontend/) would see this path."""
    p = norm_path(rel)
    return p == "frontend" or p.startswith("frontend/")


def parse_porcelain(lines: Iterable[str]) -> list[str]:
    out: list[str] = []
    for raw in lines:
        line = raw.rstrip("\n")
        if not line.strip():
            continue
        # XY PATH or XY ORIG -> PATH
        path = line[3:] if len(line) > 3 else line
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        path = norm_path(path)
        if path and path not in out:
            out.append(path)
    return out


def classify_dirty(paths: Iterable[str], bake_class: str) -> tuple[list[str], list[str], list[str]]:
    product: list[str] = []
    allow: list[str] = []
    other_frontend: list[str] = []
    for rel in paths:
        if ignore_porcelain_path(rel):
            continue
        if is_product_path(rel):
            product.append(rel)
            continue
        if is_allowlist_path(rel):
            allow.append(rel)
            continue
        if frontend_bake_path(rel) or bake_class == "web3_overlay":
            # Overlay also refuses random non-frontend dirty that is not allowlist
            # when the path is under frontend/. Non-frontend non-allowlist is ok
            # for full bake (not in Docker context) except we still refuse
            # unknown frontend files.
            if frontend_bake_path(rel):
                other_frontend.append(rel)
    return product, allow, other_frontend


def forbidden_worktree(root: Path) -> str | None:
    text = str(root).replace("\\", "/").lower()
    for marker in FORBIDDEN_WORKTREE_MARKERS:
        if marker in text:
            return marker
    if "/.worktrees/" in text + "/":
        name = root.name.lower()
        if name != ALLOWED_OVERLAY_WORKTREE:
            return f"worktree:{root.name}"
    return None


def git_porcelain(root: Path) -> list[str]:
    try:
        proc = subprocess.run(
            ["git", "-C", str(root), "status", "--porcelain", "--untracked-files=all"],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
    except OSError as e:
        fail(f"git status failed: {e}")
    if proc.returncode != 0:
        fail(f"git status exit {proc.returncode}: {proc.stderr.strip()[:400]}")
    return parse_porcelain(proc.stdout.splitlines())


def git_head(root: Path) -> str:
    proc = subprocess.run(
        ["git", "-C", str(root), "rev-parse", "HEAD"],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        return ""
    return proc.stdout.strip()


def env_truthy(name: str) -> bool:
    return os.environ.get(name, "").strip() == "1"


def identity_honesty_fail(head: str, dirty_frontend: bool) -> str | None:
    spoof = os.environ.get("TRAVELTRUST_GIT_SHA", "").strip().lower()
    pin = PIN_GIT_SHA.lower()
    if spoof and spoof.startswith(pin[:12]) and dirty_frontend:
        return (
            f"TRAVELTRUST_GIT_SHA={spoof[:12]}… with dirty frontend — "
            "identity SHA must not hide product bytes (the 08-16 accident)"
        )
    if dirty_frontend and head.lower().startswith(pin[:12]):
        # HEAD can stay daa5ae87 while uncommitted product ships. Refuse.
        return (
            f"HEAD={head[:12]}… is the identity pin but frontend is dirty — "
            "Docker COPY would ship uncommitted product bytes under a frozen SHA"
        )
    return None


def evaluate(
    *,
    root: Path,
    pin: dict,
    bake_class: str,
    porcelain: list[str] | None = None,
    head: str | None = None,
    skip_git: bool = False,
) -> list[str]:
    fails: list[str] = []
    status = str(pin.get("status") or "")
    frozen = status == "OFFICIAL_WWW_PRODUCT_SURFACE_FROZEN"
    live = pin.get("live") or {}
    restore = str(
        (pin.get("restore") or {}).get("handle")
        or live.get("fly_image")
        or ""
    )

    wt = forbidden_worktree(root)
    if wt and bake_class in {"full", "web3_overlay"}:
        fails.append(
            f"refuse Official www bake from forbidden tree ({wt}). "
            f"Use living tip or .worktrees/{ALLOWED_OVERLAY_WORKTREE} with allowlist only"
        )

    if porcelain is None and not skip_git:
        porcelain = git_porcelain(root)
    porcelain = porcelain or []
    if head is None and not skip_git:
        head = git_head(root)
    head = head or ""

    product, allow, other_fe = classify_dirty(porcelain, bake_class)
    dirty_frontend = bool(product or other_fe or (allow and bake_class == "full"))

    # Baseline-pin skip must never weaken this gate.
    if env_truthy("TT_SKIP_OFFICIAL_BASELINE_PIN"):
        print(
            "NOTE: TT_SKIP_OFFICIAL_BASELINE_PIN=1 is ignored by the product-surface gate",
            file=sys.stderr,
        )

    check_only = env_truthy("TT_OFFICIAL_SURFACE_CHECK_ONLY")

    if bake_class == "restore_image":
        if not restore:
            fails.append("restore_handle missing in freeze JSON")
        if (
            not check_only
            and not skip_git
            and not env_truthy("TT_OFFICIAL_WWW_RESTORE_PIN")
        ):
            fails.append(
                "restore_image class is documentation/check only unless "
                "TT_OFFICIAL_WWW_RESTORE_PIN=1 (fly deploy --image, no rebuild)"
            )
        return fails

    if bake_class == "full":
        if frozen and not env_truthy("TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK"):
            fails.append(
                "full tt-web-prod bake FORBIDDEN while "
                "OFFICIAL_WWW_PRODUCT_SURFACE_FROZEN. Web3 work must not rebuild www. "
                "Restore = fly deploy --image "
                f"{PIN_IMAGE_TAG}. Overlay = deploy-tt-web-production-web3-overlay.sh. "
                "Product unlock only: TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK=1 + Owner-named real error"
            )
        if product:
            fails.append("product-path dirty (announcements/ticker/FIVE-MAIN/locales/admin): " + ", ".join(product[:12]))
        if other_fe and not env_truthy("TT_OFFICIAL_ALLOW_DIRTY_TREE"):
            fails.append("frontend dirty outside overlay allowlist: " + ", ".join(other_fe[:12]))
        if allow and not env_truthy("TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK"):
            # Allowlist-only diffs still must not go through full bake by default.
            fails.append(
                "allowlist-only Web3 diffs must use web3_overlay, not full bake: "
                + ", ".join(allow[:12])
            )
        if dirty_frontend and not env_truthy("TT_OFFICIAL_ALLOW_DIRTY_TREE"):
            ih = identity_honesty_fail(head, True)
            if ih:
                fails.append(ih)
        return fails

    if bake_class == "web3_overlay":
        if frozen and not env_truthy("TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT"):
            fails.append(
                "git-tree web3_overlay FORBIDDEN while Official www is FROZEN. "
                "Docker COPY . ./ rebuilds the whole Next app from the worktree; "
                f"git {PIN_GIT_SHA[:12]}… is the identity stamp, not live product bytes "
                f"(restore_handle={PIN_IMAGE_TAG}). Web3 default = chain + API /meta. "
                "Owner override (accepts git≠image): TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT=1 "
                "+ TT_OFFICIAL_WEB3_OVERLAY_UNLOCK=1"
            )
        if not env_truthy("TT_OFFICIAL_WEB3_OVERLAY_UNLOCK") and not check_only:
            fails.append(
                "web3_overlay FORBIDDEN unless TT_OFFICIAL_WEB3_OVERLAY_UNLOCK=1 "
                "(Owner). Default Web3 path is chain + API /meta — not www bake"
            )
        if product:
            fails.append(
                "web3_overlay touched product paths (refuse): " + ", ".join(product[:12])
            )
        if other_fe:
            fails.append(
                "web3_overlay dirty non-allowlist frontend: " + ", ".join(other_fe[:12])
            )
        ih = identity_honesty_fail(head, bool(product or other_fe or allow))
        if ih and allow:
            # Overlay with allowlist dirty: still refuse spoofing pin SHA.
            spoof = os.environ.get("TRAVELTRUST_GIT_SHA", "").strip().lower()
            if spoof.startswith(PIN_GIT_SHA[:12].lower()):
                fails.append(ih)
        return fails

    fails.append(f"unknown bake class {bake_class!r}")
    return fails


def self_test() -> int:
    pin = {
        "status": "OFFICIAL_WWW_PRODUCT_SURFACE_FROZEN",
        "live": {"git_sha": PIN_GIT_SHA, "fly_image": f"registry.fly.io/tt-web-prod:{PIN_IMAGE_TAG}"},
        "restore": {"handle": f"registry.fly.io/tt-web-prod:{PIN_IMAGE_TAG}"},
    }
    root = Path("/tmp/TravelTrust-V1.1")

    # 1. frozen full bake refused even on clean tree
    os.environ.pop("TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK", None)
    os.environ.pop("TT_SKIP_OFFICIAL_BASELINE_PIN", None)
    f = evaluate(root=root, pin=pin, bake_class="full", porcelain=[], head=PIN_GIT_SHA, skip_git=True)
    if not any("FORBIDDEN" in x for x in f):
        print("self-test FAIL: clean frozen full bake must be forbidden", file=sys.stderr)
        return 1

    # 2. skip baseline pin does not allow full bake
    os.environ["TT_SKIP_OFFICIAL_BASELINE_PIN"] = "1"
    f = evaluate(root=root, pin=pin, bake_class="full", porcelain=[], head=PIN_GIT_SHA, skip_git=True)
    if not any("FORBIDDEN" in x for x in f):
        print("self-test FAIL: TT_SKIP_OFFICIAL_BASELINE_PIN must not unlock product surface", file=sys.stderr)
        return 1
    os.environ.pop("TT_SKIP_OFFICIAL_BASELINE_PIN", None)

    # 3. announcements dirty is product deny even with product unlock (still listed)
    os.environ["TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK"] = "1"
    f = evaluate(
        root=root,
        pin=pin,
        bake_class="full",
        porcelain=["frontend/components/traveltrust/cinematic/TravelTrustAnnouncementsPage.tsx"],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if not any("product-path dirty" in x for x in f):
        print("self-test FAIL: product path must deny", file=sys.stderr)
        return 1
    os.environ.pop("TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK", None)

    # 4. overlay with announcements dirty fails
    os.environ["TT_OFFICIAL_WEB3_OVERLAY_UNLOCK"] = "1"
    f = evaluate(
        root=root,
        pin=pin,
        bake_class="web3_overlay",
        porcelain=["frontend/components/traveltrust/cinematic/TravelTrustPulseTicker.tsx"],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if not any("product paths" in x for x in f):
        print("self-test FAIL: overlay must refuse ticker", file=sys.stderr)
        return 1

    # 5. frozen overlay from git refused even with allowlist + unlock
    os.environ["TT_OFFICIAL_WEB3_OVERLAY_UNLOCK"] = "1"
    f = evaluate(
        root=root,
        pin=pin,
        bake_class="web3_overlay",
        porcelain=["frontend/lib/escrowFactoryEnv.ts"],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if not any("git-tree web3_overlay FORBIDDEN" in x for x in f):
        print("self-test FAIL: frozen overlay from git must be forbidden", file=sys.stderr)
        return 1

    # 5b. overlay allowlist-only + unlock + FROM_GIT passes
    os.environ["TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT"] = "1"
    f = evaluate(
        root=root,
        pin=pin,
        bake_class="web3_overlay",
        porcelain=["frontend/lib/escrowFactoryEnv.ts"],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if f:
        print("self-test FAIL: overlay allowlist+FROM_GIT should pass, got", f, file=sys.stderr)
        return 1
    os.environ.pop("TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT", None)

    # 6. overlay without unlock fails
    os.environ.pop("TT_OFFICIAL_WEB3_OVERLAY_UNLOCK", None)
    f = evaluate(
        root=root,
        pin=pin,
        bake_class="web3_overlay",
        porcelain=["frontend/lib/escrowFactoryEnv.ts"],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if not f:
        print("self-test FAIL: overlay must require unlock", file=sys.stderr)
        return 1

    # 7. forbidden worktree
    os.environ["TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK"] = "1"
    f = evaluate(
        root=Path("D:/TravelTrust-V1.1/.worktrees/ugc-translate-official-fe"),
        pin=pin,
        bake_class="full",
        porcelain=[],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if not any("forbidden tree" in x for x in f):
        print("self-test FAIL: ugc worktree must be refused", file=sys.stderr)
        return 1
    os.environ.pop("TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK", None)

    # 8. identity spoof
    os.environ["TT_OFFICIAL_WEB3_OVERLAY_UNLOCK"] = "1"
    os.environ["TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT"] = "1"
    os.environ["TRAVELTRUST_GIT_SHA"] = PIN_GIT_SHA
    f = evaluate(
        root=root,
        pin=pin,
        bake_class="web3_overlay",
        porcelain=["frontend/lib/escrowFactoryEnv.ts"],
        head=PIN_GIT_SHA,
        skip_git=True,
    )
    if not any("TRAVELTRUST_GIT_SHA" in x or "identity" in x for x in f):
        print("self-test FAIL: spoofed pin SHA on overlay must fail", file=sys.stderr)
        return 1
    os.environ.pop("TRAVELTRUST_GIT_SHA", None)
    os.environ.pop("TT_OFFICIAL_WEB3_OVERLAY_UNLOCK", None)
    os.environ.pop("TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT", None)

    # 9. path helpers
    assert is_product_path("frontend/locales/zh-CN/common.json")
    assert is_product_path("frontend/app/(home)/page.tsx")
    assert is_allowlist_path("frontend/dapp/abis/EscrowFactoryV2.json")
    assert not is_product_path("frontend/lib/escrowFactoryEnv.ts")
    assert parse_porcelain([" M frontend/locales/en.json"]) == ["frontend/locales/en.json"]

    print("PASS: official-www-product-surface self-test")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="")
    ap.add_argument("--pin-json", default="")
    ap.add_argument(
        "--class",
        dest="bake_class",
        default=os.environ.get("TT_OFFICIAL_BAKE_CLASS", "full"),
        choices=("full", "web3_overlay", "restore_image"),
    )
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args(argv)

    if args.self_test:
        return self_test()

    root = Path(args.root or os.environ.get("TRAVELTRUST_DEPLOY_ROOT") or Path(__file__).resolve().parents[3])
    pin_path = Path(args.pin_json or root / PIN_REL)
    pin = load_pin(pin_path)
    fails = evaluate(root=root, pin=pin, bake_class=args.bake_class)
    if fails:
        for item in fails:
            print(f"FAIL: official-www-product-surface: {item}", file=sys.stderr)
        print(
            "STOP: Official www pin "
            f"git_sha={PIN_GIT_SHA[:12]}… build_time={PIN_BUILD_TIME} "
            f"restore_handle={PIN_IMAGE_TAG}",
            file=sys.stderr,
        )
        return 2
    ok(f"class={args.bake_class} root={root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
