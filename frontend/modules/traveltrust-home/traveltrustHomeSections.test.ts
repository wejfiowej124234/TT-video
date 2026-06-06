import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HOME_SECTION_CHUNK_LOADERS,
  TRAVELTRUST_HOME_SECTION_ORDER,
} from "./sections/registry";

describe("traveltrust-home section registry", () => {
  it("maps every below-fold section id to a chunk loader", () => {
    for (const id of TRAVELTRUST_HOME_SECTION_ORDER) {
      if (id === "hero") continue;
      expect(TRAVELTRUST_HOME_SECTION_CHUNK_LOADERS[id]).toBeTypeOf("function");
    }
  });
});
