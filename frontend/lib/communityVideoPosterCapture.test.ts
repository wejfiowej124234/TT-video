import { describe, it, expect } from "vitest";
import { uploadPosterJpegFromVideoBlobUrl } from "./communityVideoPosterCapture";

describe("uploadPosterJpegFromVideoBlobUrl", () => {
  it("returns null when url is not a blob URL", async () => {
    await expect(
      uploadPosterJpegFromVideoBlobUrl("https://example.com/a.mp4", 512_000)
    ).resolves.toBeNull();
    await expect(uploadPosterJpegFromVideoBlobUrl("/api/v1/x", 512_000)).resolves.toBeNull();
  });
});
