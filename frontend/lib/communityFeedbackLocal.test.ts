import { describe, expect, it } from "vitest";
import {
  FEEDBACK_LOCAL_KEY,
  readFeedbackLocalStorage,
  writeFeedbackLocalStorage,
  type CommunityFeedbackLocalItem,
} from "./communityFeedbackLocal";

function mockStore(): { map: Map<string, string>; getItem: Storage["getItem"]; setItem: Storage["setItem"] } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

describe("readFeedbackLocalStorage", () => {
  it("returns empty for null store", () => {
    expect(readFeedbackLocalStorage(null)).toEqual([]);
  });

  it("returns empty for missing key", () => {
    const { getItem } = mockStore();
    expect(readFeedbackLocalStorage({ getItem })).toEqual([]);
  });

  it("filters rows without id or created_at", () => {
    const { getItem, setItem } = mockStore();
    const bad: CommunityFeedbackLocalItem[] = [
      { id: "", category: "c", content: "x", created_at: "2020-01-01" },
      { id: "a", category: "c", content: "x", created_at: "" },
      { id: "ok", category: "c", content: "y", created_at: "2020-01-02T00:00:00.000Z" },
    ];
    setItem(FEEDBACK_LOCAL_KEY, JSON.stringify(bad));
    expect(readFeedbackLocalStorage({ getItem })).toEqual([bad[2]]);
  });

  it("returns empty on invalid JSON", () => {
    const { getItem, setItem } = mockStore();
    setItem(FEEDBACK_LOCAL_KEY, "{");
    expect(readFeedbackLocalStorage({ getItem })).toEqual([]);
  });
});

describe("writeFeedbackLocalStorage", () => {
  it("no-ops for null store", () => {
    writeFeedbackLocalStorage(null, [{ id: "1", category: "c", content: "x", created_at: "t", local: true }]);
  });

  it("persists only local===true items", () => {
    const { getItem, setItem, map } = mockStore();
    const items: CommunityFeedbackLocalItem[] = [
      { id: "s1", category: "c", content: "server", created_at: "t1", local: false },
      { id: "l1", category: "c", content: "local", created_at: "t2", local: true },
    ];
    writeFeedbackLocalStorage({ setItem }, items);
    const raw = map.get(FEEDBACK_LOCAL_KEY);
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!) as CommunityFeedbackLocalItem[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("l1");
  });
});
