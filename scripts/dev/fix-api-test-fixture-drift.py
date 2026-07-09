#!/usr/bin/env python3
"""Add ..Default::default() only inside #[cfg(test)] modules and tests/*.rs files."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API_SRC = ROOT / "crates" / "api" / "src"

SKIP_FILES = {
    "chain/mod.rs",
    "chain_off/mod.rs",
    "chain_off/rows.rs",
    "vacancy_indexer_lib.rs",
    "main.rs",
}

STRUCT_MARKERS = ("ChainConfig", "OrderRow", "GuideRow")


def is_test_file(rel: str) -> bool:
    name = Path(rel).name
    return (
        "/tests/" in rel.replace("\\", "/")
        or name.startswith("tests_")
        or name.endswith("_tests.rs")
        or name == "tests.rs"
    )


def patch_struct_literal(block: str) -> tuple[str, bool]:
    if "..Default::default()" in block:
        return block, False
    if not any(m in block.split("{", 1)[0] for m in STRUCT_MARKERS):
        return block, False
    close = block.rfind("}")
    if close <= 0:
        return block, False
    inner = block[:close].rstrip()
    indent = "        "
    for line in reversed(inner.splitlines()):
        if line.strip():
            indent = re.match(r"^(\s*)", line).group(1)
            break
    if inner.endswith(","):
        patched = f"{inner}\n{indent}..Default::default()\n{indent}}}"
    else:
        patched = f"{inner},\n{indent}..Default::default()\n{indent}}}"
    return patched + block[close + 1 :], True


def matching_close_brace(text: str, open_brace: int) -> int | None:
    depth = 0
    i = open_brace
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return None


def patch_text(text: str) -> tuple[str, int]:
    changed = 0
    opens = list(
        re.finditer(
            r"(?:^|\s)((?:chain::|crate::chain::|chain_off::)?(?:ChainConfig|OrderRow|GuideRow))\s*\{",
            text,
            re.MULTILINE,
        )
    )
    for m in reversed(opens):
        start = m.start(1)
        open_brace = text.find("{", start)
        close = matching_close_brace(text, open_brace)
        if close is None:
            continue
        block = text[start : close + 1]
        patched, did = patch_struct_literal(block)
        if did:
            text = text[:start] + patched + text[close + 1 :]
            changed += 1
    return text, changed


def extract_test_sections(text: str) -> list[tuple[int, int]]:
    """Return byte ranges inside #[cfg(test)] mod ... { ... } blocks."""
    sections: list[tuple[int, int]] = []
    for m in re.finditer(r"#\[cfg\(test\)\]\s*\n(?:pub\s+)?mod\s+\w+\s*\{", text):
        open_brace = text.find("{", m.end() - 1)
        close = matching_close_brace(text, open_brace)
        if close is not None:
            sections.append((open_brace + 1, close))
    return sections


def main() -> None:
    total = 0
    for path in sorted(API_SRC.rglob("*.rs")):
        rel = str(path.relative_to(API_SRC)).replace("\\", "/")
        if rel in SKIP_FILES:
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        if is_test_file(rel):
            text, n = patch_text(text)
        else:
            n = 0
            for start, end in extract_test_sections(text):
                chunk = text[start:end]
                patched, c = patch_text(chunk)
                if c:
                    text = text[:start] + patched + text[end:]
                    n += c
        if text != original:
            path.write_text(text, encoding="utf-8", newline="\n")
            print(f"patched {n} in {rel}")
            total += n
    print(f"TT_FIX_API_TEST_FIXTURE_DRIFT: total_literals={total}")


if __name__ == "__main__":
    main()
