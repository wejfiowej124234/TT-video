import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { TransparencyBundleV1 } from "@/lib/trust/buildTransparencyBundle";
import { fingerprintFromTransparencyBundle, TRANSPARENCY_FINGERPRINT_CODEC_ID } from "@/lib/trust/transparencyFingerprint";

/** 与 `node scripts/p004-verify-transparency.mjs` 对同一 fixture 的输出一致（P-004 跨端契约） */
const GOLDEN_FIXTURE_FINGERPRINT = "8f3e528c748d797f3545665695813552831a09d6606c24f3b562fda839f1629a";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("transparencyFingerprint", () => {
  it("codec id is stable", () => {
    expect(TRANSPARENCY_FINGERPRINT_CODEC_ID).toContain("stable_json_keysort_utf8_sha256");
  });

  it("matches Node p004 script on golden fixture", async () => {
    const p = path.join(__dirname, "fixtures", "transparency_bundle_min.v1.json");
    const raw = readFileSync(p, "utf8");
    const bundle = JSON.parse(raw) as TransparencyBundleV1;
    const fp = await fingerprintFromTransparencyBundle(bundle);
    expect(fp).toBe(GOLDEN_FIXTURE_FINGERPRINT);
  });
});
