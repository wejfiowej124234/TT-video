#!/usr/bin/env python3
import json, os, subprocess
from pathlib import Path

def load(path: Path, default: dict) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default

def main() -> int:
    root = Path(__file__).resolve().parents[2]
    out = Path(os.environ.get("CDA_OUT", root / "evidence/community-deep-audit/latest"))
    partial = load(out / "cda-findings-partial.json", {"verdict": "FAIL", "probes": []})
    pg = load(out / "cda-pg-findings.json", {"verdict": "PASS", "probes": []})
    pw = load(out / "cda-playwright-findings.json", {"verdict": "PASS", "ui_probes": []})
    probes = list(partial.get("probes", []))
    for p in pg.get("probes", []):
        probes.append({**p, "section": "pg_consistency"})
    for p in pw.get("ui_probes", []):
        probes.append({**p, "section": "ui_corridor"})
    fails = [p for p in probes if p.get("status") not in ("PASS", "WARN")]
    verdict = "PASS" if not fails and partial.get("verdict") == "PASS" and pg.get("verdict") == "PASS" and pw.get("verdict") == "PASS" else "FAIL"
    try:
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    except Exception:
        sha = "unknown"
    merged = {**partial, "verdict": verdict, "git_sha": sha, "probes": probes}
    (out / "cda-findings.json").write_text(json.dumps(merged, indent=2), encoding="utf-8")
    print(f"CDA_MERGE: {verdict}")
    return 0 if verdict == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
