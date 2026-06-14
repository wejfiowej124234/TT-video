import { describe, expect, it } from "vitest";
import { POI_IMAGE_CANDIDATE_ENTRIES } from "./poiImageCandidates";
import { POI_IMAGE_VERIFICATION_BATCHES } from "./poiImageBatches";
import { POI_IMAGE_WHITELIST } from "./poiImageWhitelist";

describe("poiImageCandidates integrity", () => {
  it("每个 POI 有 3–5 张候选（含 REJECTED 对照）", () => {
    for (const entry of POI_IMAGE_CANDIDATE_ENTRIES) {
      expect(
        entry.candidates.length,
        `${entry.poiId} candidate count`
      ).toBeGreaterThanOrEqual(3);
      expect(entry.candidates.length).toBeLessThanOrEqual(5);
    }
  });

  it("候选 URL 格式合法", () => {
    for (const entry of POI_IMAGE_CANDIDATE_ENTRIES) {
      for (const c of entry.candidates) {
        expect(c.previewUrl).toMatch(/^https:\/\//);
        expect(c.sourcePageUrl).toMatch(/^https:\/\//);
        expect(c.sceneDescription.length).toBeGreaterThan(4);
        expect(["PENDING", "APPROVED", "REJECTED"]).toContain(c.status);
      }
    }
  });

  it("批次元数据与条目 batchId 一致", () => {
    const batchIds = new Set(POI_IMAGE_VERIFICATION_BATCHES.map((b) => b.batchId));
    for (const entry of POI_IMAGE_CANDIDATE_ENTRIES) {
      expect(batchIds.has(entry.batchId), entry.batchId).toBe(true);
    }
  });

  it("白名单项必须在候选中有 APPROVED 记录", () => {
    for (const [poiId, wl] of Object.entries(POI_IMAGE_WHITELIST)) {
      const entry = POI_IMAGE_CANDIDATE_ENTRIES.find((e) => e.poiId === poiId);
      expect(entry).toBeDefined();
      const cand = entry!.candidates.find((c) => c.id === wl.approvedCandidateId);
      expect(cand?.status).toBe("APPROVED");
    }
  });

  it("无 APPROVED 候选时不应出现在白名单", () => {
    for (const entry of POI_IMAGE_CANDIDATE_ENTRIES) {
      const approved = entry.candidates.filter((c) => c.status === "APPROVED");
      if (approved.length === 0) {
        expect(POI_IMAGE_WHITELIST[entry.poiId]).toBeUndefined();
      }
    }
  });
});
