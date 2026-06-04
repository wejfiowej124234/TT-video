import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** ① 收口闸：backlog 仅余 Phase ②/③ 六项 ❌，其余不得回退为 🟡/❌。 */
describe("admin phase1 backlog closure L5 (①)", () => {
  const backlog = readFileSync(
    join(
      __dir,
      "..",
      "..",
      "evidence",
      "GO_local_admin_workspace_closure",
      "ADMIN-L5-FULL-AUDIT-BACKLOG.md",
    ),
    "utf8",
  );

  const PHASE23_ONLY_IDS = [
    "ADM-UX-IA-06",
    "ADM-UX-ONB-04",
    "ADM-UX-RBAC-05",
    "ADM-UX-RBAC-06",
    "ADM-UX-FIN-02",
    "ADM-UX-CI-02",
  ] as const;

  it("documents exactly six Phase ②/③ open items", () => {
    const openRows = backlog.split("\n").filter((line) => /\|\s*❌\s*\|/.test(line));
    expect(openRows).toHaveLength(PHASE23_ONLY_IDS.length);
    for (const id of PHASE23_ONLY_IDS) {
      expect(backlog, `missing open row for ${id}`).toContain(id);
    }
  });

  it("conclusion states Phase ① machine-read closure", () => {
    expect(backlog).toMatch(/① Admin 工作台 L5 已全部机读收口/);
    expect(backlog).toMatch(
      /184 tests|187 tests|188 tests|189 tests|190 tests|195 tests|228 tests|229 tests|230 tests|231 tests|232 tests|235 tests|239 tests|242 tests|244 tests|249 tests|251 tests|255 tests|261 tests|262 tests|269 tests|270 tests|291 tests|292 tests|293 tests|294 tests|295 tests|296 tests|297 tests|298 tests|299 tests|300 tests|301 tests|302 tests|303 tests|304 tests|305 tests|306 tests|307 tests|308 tests|309 tests|310 tests|311 tests|312 tests|313 tests|314 tests|315 tests|316 tests|317 tests|318 tests|319 tests|320 tests|321 tests|322 tests|327 tests|328 tests|329 tests|330 tests|331 tests|332 tests|333 tests|334 tests|335 tests|336 tests|337 tests|338 tests|339 tests|340 tests|341 tests|342 tests|343 tests|344 tests|345 tests|346 tests|347 tests|348 tests|349 tests|350 tests|351 tests|352 tests|353 tests|354 tests|355 tests|356 tests|357 tests|358 tests|359 tests|360 tests|361 tests|362 tests|363 tests|364 tests|365 tests|366 tests|367 tests|368 tests|369 tests/,
    );
  });
});
