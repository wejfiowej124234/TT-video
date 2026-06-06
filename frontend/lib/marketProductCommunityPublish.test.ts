import { describe, expect, it } from "vitest";
import { COMMERCE_SHOWCASE_KIND } from "./marketProductCommunityPublish";

/** 与 **`crates/api/src/routes/community/posts/create/commerce.rs`** **`resolve_commerce_showcase_fields`**（**`create/handler.rs`** **`create_post`**）`allowed` 匹配分支同源。 */
const RUST_CREATE_POST_COMMERCE_KINDS = [
  "itinerary_led",
  "lodging_led",
  "acquisition_led",
  "general_led",
] as const;

describe("COMMERCE_SHOWCASE_KIND (A1 · 04 / posts.rs 对拍)", () => {
  it("object values equal the backend allowlist (sorted)", () => {
    const fromTs = Object.values(COMMERCE_SHOWCASE_KIND).slice().sort();
    const fromRust = [...RUST_CREATE_POST_COMMERCE_KINDS].sort();
    expect(fromTs).toEqual(fromRust);
  });
});
