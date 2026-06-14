import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  attachOrderParticipantHint,
  formatOrderParticipantMismatchMessage,
  parseOrderParticipantHint,
} from "../orderParticipantHint";

const root = join(__dirname, "..", "..");
export const SEED_MAIN_CHAIN_CLARITY_FROZEN = true as const;

describe("Seed/Main-Chain Clarity Sprint (① local · frozen)", () => {
  it("freeze doc is ACTIVE", () => {
    const freeze = readFileSync(
      join(root, "evidence/GO_local_web3_itinerary_l5/SEED-MAIN-CHAIN-CLARITY-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(SEED_MAIN_CHAIN_CLARITY_FROZEN).toBe(true);
  });
  it("docs split public catalog main chain vs tourist+guide seed chain", () => {
    const doc = readFileSync(join(root, "..", "docs", "测试账号与本地联调.md"), "utf8");
    expect(doc).toContain("公众 catalog 主链");
    expect(doc).toContain("tourist+guide 种子联调链");
    expect(doc).toContain("tg_guide_main@trustgate-e2e.local");
    expect(doc).toContain("guide@test.com");
    expect(doc).toContain("勿混用");
  });

  it("Escrow hooks use mapEscrowForbiddenError for 403", () => {
    const useEscrow = readFileSync(
      join(root, "components", "escrow", "EscrowDetail", "useEscrowDetail.ts"),
      "utf8",
    );
    const chainSync = readFileSync(
      join(root, "components", "escrow", "EscrowDetail", "useEscrowDetailOrderChainSyncLoad.ts"),
      "utf8",
    );
    expect(useEscrow).toContain("mapEscrowForbiddenError");
    expect(chainSync).toContain("mapEscrowForbiddenError");
  });

  it("parseResponse attaches participant hint on forbidden / not_assigned_guide", () => {
    const core = readFileSync(join(root, "lib", "apiClient", "core.ts"), "utf8");
    expect(core).toContain("throwWithParticipantHint");
    expect(core).toContain("not_assigned_guide");
  });

  it("formats guide hint for wrong account accept", () => {
    const t = (key: string, vars?: Record<string, string>) => {
      if (key === "seed_main_chain_label_public_catalog") return "公众 catalog 主链";
      if (key === "escrow_wrong_guide_accept_hint") {
        return `请用 ${vars?.email}（${vars?.chain}）`;
      }
      return key;
    };
    const err = attachOrderParticipantHint(new Error("not_assigned_guide"), {
      assigned_guide_email: "tg_guide_main@trustgate-e2e.local",
      debug_chain: "public_catalog_main",
    });
    expect(formatOrderParticipantMismatchMessage(err, t, "accept")).toBe(
      "请用 tg_guide_main@trustgate-e2e.local（公众 catalog 主链）",
    );
  });

  it("parses API hint fields", () => {
    const hint = parseOrderParticipantHint({
      hint: "order_participant_mismatch",
      assigned_guide_email: "guide@test.com",
      tourist_email: "tourist@test.com",
      debug_chain: "tourist_guide_seed",
    });
    expect(hint?.assigned_guide_email).toBe("guide@test.com");
    expect(hint?.debug_chain).toBe("tourist_guide_seed");
  });
});
