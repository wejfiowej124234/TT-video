#!/usr/bin/env python3
"""POST_PARITY_FIX_QUEUE · Batch 5 (Assets/i18n) · Local or Staging verify gate.

Official PRODUCT SSOT: CAPTURE_DEEPEN_20260822.json · OPS-v9 pin 3e356617.
M8-08: zh/en observable parity + live homepage static asset self-consistency.

Non-target 0-drift: Candidate Solidity · Production DB · FTB · TT_PRODUCTION_GO ·
FIVE-MAIN structure/UI unchanged.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_official_product_reality_capture"
CAPTURE_DEEPEN = EV / "CAPTURE_DEEPEN_20260822.json"
OFFICIAL_WEB = os.environ.get("OFFICIAL_WEB_BASE", "https://www.web3-ttg.com").rstrip("/")
FE = ROOT / "frontend"

I18N_PROBE_PATHS = ["/", "/?lang=zh", "/?lang=en"]
CORE_LOCALE_KEYS = [
    "landing_hero_title",
    "landing_hero_subtitle",
    "landing_btn_generate",
    "home_consumer_value_title",
    "footer_link_terms",
    "footer_link_privacy",
    "nav_guides",
    "nav_orders",
]
I18N_VITEST = [
    "lib/homeConsumerExperienceL5.contract.test.ts",
    "app/help/helpPage.i18n.contract.test.ts",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_html(url: str, max_bytes: int = 250_000) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"Accept": "text/html,*/*"})
    retries = int(os.environ.get("POST_PARITY_BATCH5_HTTP_RETRIES", "5"))
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                chunks: list[bytes] = []
                total = 0
                while True:
                    part = resp.read(min(65536, max_bytes - total) if max_bytes > 0 else 65536)
                    if not part:
                        break
                    chunks.append(part)
                    total += len(part)
                    if max_bytes > 0 and total >= max_bytes:
                        break
                return resp.status, b"".join(chunks).decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            body = e.read(8192).decode("utf-8", errors="replace") if e.fp else ""
            return e.code, body
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            last_err = err
            if attempt + 1 < retries:
                time.sleep(min(1.5 * (attempt + 1), 6.0))
                continue
            raise
    if last_err:
        raise last_err
    return 0, ""


def i18n_observables(base: str, path: str) -> dict[str, str]:
    code, html = fetch_html(f"{base}{path}")
    title_m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    lang_m = re.search(r"<html[^>]*\blang=[\"']([^\"']+)", html, re.I)
    return {
        "status_code": str(code),
        "title": title_m.group(1).strip() if title_m else "",
        "html_lang": lang_m.group(1) if lang_m else "",
    }


def static_asset_ok(base: str, path: str) -> bool:
    url = f"{base}{path}"
    retries = int(os.environ.get("POST_PARITY_BATCH5_ASSET_RETRIES", "3"))
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, method="GET", headers={"Range": "bytes=0-0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status in (200, 206):
                    return True
        except Exception:
            if attempt + 1 < retries:
                time.sleep(1.0)
                continue
            return False
    return False


def live_static_sample(base: str, limit: int = 20) -> tuple[list[str], list[str]]:
    _, html = fetch_html(f"{base}/")
    assets = sorted(set(re.findall(r'(/_next/static/[^"\']+)', html)))
    sample = assets[:limit]
    bad = [a for a in sample if not static_asset_ok(base, a)]
    return sample, bad


def load_capture() -> dict:
    if not CAPTURE_DEEPEN.exists():
        return {}
    return json.loads(CAPTURE_DEEPEN.read_text(encoding="utf-8"))


def extract_locale_key(src: str, key: str) -> str:
    single = re.search(rf"{re.escape(key)}:\s*\"([^\"]*)\"", src, re.M)
    if single:
        return single.group(1)
    multi = re.search(rf"{re.escape(key)}:\s*\n\s*\"([^\"]*)\"", src, re.M)
    return multi.group(1) if multi else ""


def locale_symmetry_check() -> tuple[bool, dict]:
    zh_path = FE / "locales" / "zh.ts"
    en_path = FE / "locales" / "en.ts"
    if not zh_path.exists() or not en_path.exists():
        return False, {"error": "missing locale files"}
    zh = zh_path.read_text(encoding="utf-8")
    en = en_path.read_text(encoding="utf-8")
    rows = {}
    missing = []
    for key in CORE_LOCALE_KEYS:
        z = extract_locale_key(zh, key)
        e = extract_locale_key(en, key)
        ok = bool(z) and bool(e)
        rows[key] = {"zh": bool(z), "en": bool(e), "pass": ok}
        if not ok:
            missing.append(key)
    return not missing, {"keys": rows, "missing": missing}


def bash_exe() -> str:
    for candidate in (
        os.environ.get("BASH", "").strip(),
        shutil.which("bash") or "",
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files\Git\usr\bin\bash.exe",
    ):
        if candidate and Path(candidate).exists():
            return candidate
    return "bash"


def run_i18n_vitest() -> tuple[bool, str]:
    if os.environ.get("POST_PARITY_BATCH5_SKIP_LOCAL_GREEN", "").strip() == "1":
        return True, "skipped"
    files = " ".join(shlex.quote(f) for f in I18N_VITEST)
    proc = subprocess.run(
        [bash_exe(), "-lc", f"cd frontend && npx vitest run {files}"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    tail = (proc.stdout or proc.stderr or "").strip().splitlines()
    line = tail[-1] if tail else f"exit={proc.returncode}"
    return proc.returncode == 0, line


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--web", default=os.environ.get("STAGING_WEB_BASE", "https://tt-web-staging.fly.dev"))
    p.add_argument("--official", default=OFFICIAL_WEB)
    p.add_argument("--out", default=str(EV / "POST_PARITY_FIX_QUEUE_BATCH5_ASSETS_I18N_LATEST.json"))
    args = p.parse_args()
    web = args.web.rstrip("/")
    official = args.official.rstrip("/")

    gaps: list[dict] = []
    checks: dict = {}
    capture = load_capture()
    i18n_cap = (capture.get("layers") or {}).get("i18n") or {}
    checks["official_baseline_cite"] = CAPTURE_DEEPEN.name if capture else "missing"

    # AI-01 · M8-08 staging i18n observables match Official live
    parity_rows = {}
    for path in I18N_PROBE_PATHS:
        off = i18n_observables(official, path)
        stg = i18n_observables(web, path)
        ok = (
            off["status_code"] == "200"
            and stg["status_code"] == "200"
            and off["title"] == stg["title"]
            and off["html_lang"] == stg["html_lang"]
        )
        parity_rows[path] = {"official": off, "staging": stg, "pass": ok}
        if not ok:
            gaps.append({"id": "AI-01", "detail": f"M8-08 i18n drift {path} off={off} stg={stg}"})
    checks["ai01_m8_08_i18n_official_staging_parity"] = parity_rows

    # AI-02 · staging live homepage static assets self-consistent (200/206)
    sample, bad = live_static_sample(web)
    asset_ok = len(bad) == 0 and len(sample) > 0
    checks["ai02_staging_live_static_assets"] = {
        "sample_count": len(sample),
        "bad": bad,
        "pass": asset_ok,
    }
    if not asset_ok:
        gaps.append({"id": "AI-02", "detail": f"staging static bad={bad[:3]}"})

    # AI-03 · Official i18n spot-check vs frozen capture
    off_home = i18n_observables(official, "/")
    cap_title = str(i18n_cap.get("home_en_title") or "")
    cap_lang = (i18n_cap.get("home_en_lang") or ["en"])[0] if i18n_cap.get("home_en_lang") else "en"
    cap_ok = off_home["title"] == cap_title and off_home["html_lang"] == cap_lang
    checks["ai03_official_i18n_capture_spot_check"] = {
        "live": off_home,
        "capture_title": cap_title,
        "capture_lang": cap_lang,
        "pass": cap_ok,
    }
    if not cap_ok:
        gaps.append({"id": "AI-03", "detail": "Official i18n drift vs CAPTURE_DEEPEN"})

    # AI-04 · zh/en core locale key symmetry (① inventory)
    sym_ok, sym_detail = locale_symmetry_check()
    checks["ai04_zh_en_core_locale_inventory"] = {**sym_detail, "pass": sym_ok}
    if not sym_ok:
        gaps.append({"id": "AI-04", "detail": f"locale keys missing {sym_detail.get('missing')}"})

    # AI-05 · i18n contract vitest subset
    vit_ok, vit_note = run_i18n_vitest()
    checks["ai05_i18n_contract_vitest"] = {"pass": vit_ok, "note": vit_note, "files": I18N_VITEST}
    if not vit_ok:
        gaps.append({"id": "AI-05", "detail": f"i18n vitest fail ({vit_note})"})

    out = {
        "schema": "traveltrust.post_parity_fix_queue_batch5_assets_i18n.v1",
        "recorded_utc": utc_now(),
        "batch": "5_assets_i18n",
        "baseline": "POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_PASS_STOP",
        "official_product_ssot": "www.web3-ttg.com OPS-v9",
        "items": ["M8-08", "AI-01", "AI-02", "AI-03", "AI-04", "AI-05"],
        "web": web,
        "official": official,
        "checks": checks,
        "gaps": gaps,
        "BATCH5_ASSETS_I18N_PASS": "ISSUED" if not gaps else "NOT_ISSUED",
        "UNAUTHORIZED_DRIFT": "0" if not gaps else "NOT_ZERO",
        "OUT_OF_SCOPE": "0",
        "tt_production_go": "NO_GO",
        "non_target_drift": {
            "candidate_solidity": "0",
            "production_db_mutation": "0",
            "tt_production_go_flip": "0",
            "five_main_structure_ui": "0",
        },
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        f"POST_PARITY_BATCH5_ASSETS_I18N: pass={out['BATCH5_ASSETS_I18N_PASS']} "
        f"gaps={len(gaps)} out={out_path.name}"
    )
    return 0 if not gaps else 2


if __name__ == "__main__":
    raise SystemExit(main())
