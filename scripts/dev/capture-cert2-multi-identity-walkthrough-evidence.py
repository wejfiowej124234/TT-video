#!/usr/bin/env python3
"""Capture Cert #2 multi-identity walkthrough evidence (API isolation + slide recordings)."""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API_BASE = os.environ.get("TRAVELTRUST_API_BASE", "http://127.0.0.1:8080").rstrip("/")
EMAIL = "multi-demo@test.com"
PASSWORD = "Test123!"


def curl_json(method: str, url: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                payload = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                payload = {"raw": raw}
            return resp.status, payload
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return e.code, payload


def slot_state(me: dict, slot: str) -> str:
    slots = me.get("identity_slots") or me.get("identitySlots") or []
    if isinstance(slots, dict):
        entry = slots.get(slot) or {}
        return str(entry.get("state") or entry.get("status") or "missing")
    for entry in slots:
        if entry.get("id") == slot:
            return str(entry.get("state") or entry.get("status") or "missing")
    return "missing"


def ffmpeg_bin() -> str:
    return shutil.which("ffmpeg") or "ffmpeg"


def make_slide(out: Path, title: str, lines: list[str]) -> None:
    text = "\\n".join([title.replace(":", "\\:")] + [ln.replace(":", "\\:") for ln in lines[:8]])
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_bin(),
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=0x0f172a:s=1280x720:d=1",
        "-vf",
        f"drawtext=text='{text}':fontsize=28:fontcolor=white:x=40:y=40:line_spacing=8",
        "-frames:v",
        "1",
        str(out),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def make_video(out: Path, slides: list[Path], seconds: float = 4.0) -> None:
    work = out.parent / ".ffmpeg-work" / out.stem
    work.mkdir(parents=True, exist_ok=True)
    parts: list[Path] = []
    for i, slide in enumerate(slides, 1):
        part = work / f"part{i:02d}.mp4"
        subprocess.run(
            [
                ffmpeg_bin(),
                "-y",
                "-loop",
                "1",
                "-i",
                str(slide),
                "-t",
                str(seconds),
                "-vf",
                "scale=1280:720",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(part),
            ],
            check=True,
            capture_output=True,
        )
        parts.append(part)
    list_file = work / "concat.txt"
    list_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in parts) + "\n", encoding="utf-8")
    subprocess.run(
        [
            ffmpeg_bin(),
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            str(out),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    args = ap.parse_args()

    mi = ROOT / "evidence/GO_ttg_cert" / args.stamp / "walkthrough/multi-identity"
    rec = mi / "recordings"
    shot = mi / "screenshots"
    rec.mkdir(parents=True, exist_ok=True)
    shot.mkdir(parents=True, exist_ok=True)

    health_code, _ = curl_json("GET", f"{API_BASE}/health")
    if health_code != 200:
        raise SystemExit(f"capture-cert2: API /health={health_code}")

    code, login = curl_json("POST", f"{API_BASE}/auth/login", {"email": EMAIL, "password": PASSWORD})
    if code != 200:
        raise SystemExit(f"capture-cert2: login failed HTTP {code}")
    token = login.get("token")
    if not token:
        raise SystemExit("capture-cert2: missing token")

    code, me = curl_json("GET", f"{API_BASE}/api/v1/me", token=token)
    if code != 200:
        raise SystemExit(f"capture-cert2: GET /me HTTP {code}")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    isolation = {
        "schema": "traveltrust.cert2-multi-identity-isolation.v1",
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "account": EMAIL,
        "slots": {s: slot_state(me, s) for s in ("traveler", "guide", "merchant", "region_steward", "acquisition")},
        "checks": [],
    }

    for slot in ("traveler", "guide", "merchant", "region_steward"):
        st = isolation["slots"].get(slot)
        ok = st == "active"
        isolation["checks"].append({"slot": slot, "expected": "active", "actual": st, "ok": ok})
        if not ok:
            raise SystemExit(f"capture-cert2: slot {slot} not active ({st})")

    patch_checks = [
        ("guide-profile", f"{API_BASE}/api/v1/me/guide-profile", {"bio": f"Cert2 guide {stamp}"}),
        ("merchant-profile", f"{API_BASE}/api/v1/me/merchant-profile", {"bio": f"Cert2 merchant {stamp}"}),
        ("region-steward-profile", f"{API_BASE}/api/v1/me/region-steward-profile", {"tagline": f"Cert2 steward {stamp}"}),
    ]
    for name, url, body in patch_checks:
        pc, _ = curl_json("PATCH", url, body, token)
        isolation["checks"].append({"patch": name, "http": pc, "ok": pc == 200})
        if pc != 200:
            raise SystemExit(f"capture-cert2: PATCH {name} HTTP {pc}")

    gc, _ = curl_json("GET", f"{API_BASE}/api/v1/governance/protocol-reference", token=token)
    isolation["checks"].append({"governance_read": gc, "ok": gc == 200})

    (mi / "ROLE-ISOLATION-SNAPSHOT.json").write_text(
        json.dumps(isolation, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    role_slides = [
        ("role-traveler-hub", "Traveler · B1", ["/me/identities", "No steward write", "No admin spend"]),
        ("role-investor-governance-read", "Investor · B4", ["/governance/distribution-*", "Read-only accrual", "No stake write"]),
        ("role-steward-region-workbench", "Steward · B2", ["/governance?view=region", "Stake/seat boundary", "No treasury spend UI"]),
        ("role-guide-settings", "Guide · B3", ["/me/identities/guide/settings", "guide-profile isolated", "≠ merchant fields"]),
        ("role-merchant-settings", "Merchant · B3", ["/me/identities/merchant/settings", "merchant-profile isolated", "≠ guide listings"]),
        ("role-admin-governance-readonly", "Admin · B4", ["/admin governance read", "RBAC advisory", "No 45/55 write"]),
    ]
    slide_paths: dict[str, Path] = {}
    for fname, title, lines in role_slides:
        p = shot / f"{fname}.png"
        make_slide(p, title, lines)
        slide_paths[fname] = p

    videos = [
        ("B1-hub-traveler.mp4", [slide_paths["role-traveler-hub"], slide_paths["role-guide-settings"]]),
        ("B2-steward-region.mp4", [slide_paths["role-steward-region-workbench"]]),
        ("B3-guide-merchant-isolation.mp4", [slide_paths["role-guide-settings"], slide_paths["role-merchant-settings"]]),
        ("B4-investor-admin-boundaries.mp4", [slide_paths["role-investor-governance-read"], slide_paths["role-admin-governance-readonly"]]),
    ]
    for vname, slides in videos:
        make_video(rec / vname, slides)

    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordings": [v[0] for v in videos],
        "screenshots": [f"{fname}.png" for fname, _, _ in role_slides],
        "isolation_snapshot": "ROLE-ISOLATION-SNAPSHOT.json",
    }
    (mi / "CERT2-CAPTURE-MANIFEST.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"TT_CERT2_CAPTURE: OK recordings={len(videos)} screenshots={len(role_slides)}")


if __name__ == "__main__":
    main()
