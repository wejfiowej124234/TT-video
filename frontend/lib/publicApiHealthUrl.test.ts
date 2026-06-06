import { describe, expect, it } from "vitest";
import { apiUrl, routes } from "./api";
import { publicApiHealthCheckUrl } from "./publicApiHealthUrl";

describe("publicApiHealthCheckUrl", () => {
  it("delegates to apiUrl(routes.health)", () => {
    expect(publicApiHealthCheckUrl()).toBe(apiUrl(routes.health));
  });
});
