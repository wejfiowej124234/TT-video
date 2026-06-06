import { describe, expect, it, beforeEach } from "vitest";
import {
  readJsonStringArrayLocalWithSessionMigration,
  writeJsonStringArrayLocal,
} from "./localStorageJson";
import { LANDING_RESULT_ORDER_IDS_KEY } from "./landingItinerarySession";

describe("localStorageJson session migration", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("migrates sessionStorage array to localStorage once", () => {
    sessionStorage.setItem(LANDING_RESULT_ORDER_IDS_KEY, JSON.stringify(["legacy"]));
    expect(readJsonStringArrayLocalWithSessionMigration(LANDING_RESULT_ORDER_IDS_KEY)).toEqual(["legacy"]);
    expect(localStorage.getItem(LANDING_RESULT_ORDER_IDS_KEY)).toBe(JSON.stringify(["legacy"]));
    expect(sessionStorage.getItem(LANDING_RESULT_ORDER_IDS_KEY)).toBeNull();
  });

  it("prefers localStorage over sessionStorage", () => {
    sessionStorage.setItem(LANDING_RESULT_ORDER_IDS_KEY, JSON.stringify(["old"]));
    writeJsonStringArrayLocal(LANDING_RESULT_ORDER_IDS_KEY, ["new"]);
    expect(readJsonStringArrayLocalWithSessionMigration(LANDING_RESULT_ORDER_IDS_KEY)).toEqual(["new"]);
  });
});
