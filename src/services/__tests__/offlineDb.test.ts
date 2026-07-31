import { describe, expect, it } from "vitest";
import {
  formatCacheTimeLabel,
  isCacheStale,
  isHomeOfflineSnapshot,
  pruneInstanceQueryRecords,
  shouldPersistQueryKey,
  STALE_UI_AGE_MS,
  type PersistedQueryRecord,
} from "@/services/offlineDb";

describe("offlineDb helpers", () => {
  it("accepts only whitelisted query keys", () => {
    expect(shouldPersistQueryKey(["records", "load", "u1", 4])).toBe(true);
    expect(shouldPersistQueryKey(["traffic-stats", "today"])).toBe(true);
    expect(shouldPersistQueryKey(["public"])).toBe(true);
    expect(shouldPersistQueryKey(["cost-rates", "url"])).toBe(true);
    expect(shouldPersistQueryKey(["me"])).toBe(false);
    expect(shouldPersistQueryKey("records")).toBe(false);
  });

  it("prunes instance records by LRU uuid limit", () => {
    const records: PersistedQueryRecord[] = [];
    for (let i = 0; i < 25; i++) {
      records.push({
        savedAt: 1_000 + i,
        queryKey: ["records", "load", `uuid-${i}`, 4],
        data: { i },
      });
      records.push({
        savedAt: 1_000 + i,
        queryKey: ["records", "ping", `uuid-${i}`, 4],
        data: { i },
      });
    }
    records.push({
      savedAt: 9_999,
      queryKey: ["traffic-stats", "today"],
      data: { ok: true },
    });

    const pruned = pruneInstanceQueryRecords(records, 20);
    const uuids = new Set(
      pruned
        .filter((r) => r.queryKey[0] === "records")
        .map((r) => String(r.queryKey[2])),
    );
    expect(uuids.size).toBe(20);
    expect(uuids.has("uuid-24")).toBe(true);
    expect(uuids.has("uuid-0")).toBe(false);
    expect(pruned.some((r) => r.queryKey[0] === "traffic-stats")).toBe(true);
  });

  it("validates home snapshot shape", () => {
    expect(
      isHomeOfflineSnapshot({
        version: 1,
        savedAt: Date.now(),
        order: ["a"],
        metaByUuid: {},
        metricsByUuid: {},
      }),
    ).toBe(true);
    expect(isHomeOfflineSnapshot({ version: 2, savedAt: 1 })).toBe(false);
  });

  it("formats cache age and stale threshold", () => {
    const now = Date.parse("2026-07-31T12:00:00.000Z");
    expect(formatCacheTimeLabel(now - 30_000, now)).toBe("刚刚");
    expect(formatCacheTimeLabel(now - 5 * 60_000, now)).toBe("5 分钟前");
    expect(isCacheStale(now - STALE_UI_AGE_MS - 1, now)).toBe(true);
    expect(isCacheStale(now - 60_000, now)).toBe(false);
  });
});
