import { describe, expect, it } from "vitest";
import {
  buildPingOverviewMap,
  buildPingBuckets,
  buildPingOverviewItems,
  resolveHomepagePingRequestMode,
} from "@/hooks/usePingOverview";

const MINUTE_MS = 60_000;
const NOW = Date.UTC(2026, 6, 17, 11, 2);
const WINDOW_START = NOW - 60 * MINUTE_MS;

function aggregateSamples(intervalMinutes: number) {
  const alignedStart = Date.UTC(2026, 6, 17, 10, 0);
  const count = Math.ceil((NOW - alignedStart) / (intervalMinutes * MINUTE_MS));
  return Array.from({ length: count }, (_, index) => ({
    time: alignedStart + index * intervalMinutes * MINUTE_MS,
    value: 40 + index,
    count: intervalMinutes,
    loss: 0,
  }));
}

describe("homepage ping metric interval adaptation", () => {
  it("propagates the metric API interval into the homepage item", () => {
    const items = buildPingOverviewItems(
      7,
      [
        {
          task_id: 7,
          time: "2026-07-17T10:00:00Z",
          value: 42,
          client: "node-a",
          count: 5,
          loss: 0,
        },
      ],
      [],
      300,
    );

    expect(items.get("node-a")?.metricIntervalMs).toBe(5 * MINUTE_MS);
  });

  it("projects 1.2.7 five-minute aggregates across twenty-four continuous buckets", () => {
    const buckets = buildPingBuckets(
      {
        metricIntervalMs: 5 * MINUTE_MS,
        samples: aggregateSamples(5),
      },
      24,
      NOW,
    );

    expect(buckets).toHaveLength(24);
    expect(buckets.every((bucket) => bucket.total > 0 && bucket.value != null)).toBe(true);
    expect(buckets[0]?.startAt).toBe(WINDOW_START);
    expect(buckets[23]?.endAt).toBe(NOW);
  });

  it("removes the compact-card two-on one-off artifact without hiding a real gap", () => {
    const samples = aggregateSamples(5).filter(
      (sample) => sample.time !== Date.UTC(2026, 6, 17, 10, 30),
    );
    const buckets = buildPingBuckets(
      { metricIntervalMs: 5 * MINUTE_MS, samples },
      18,
      NOW,
    );

    expect(buckets).toHaveLength(18);
    expect(buckets.filter((bucket) => bucket.total === 0)).toHaveLength(2);
  });

  it("keeps 1.2.6 two-minute aggregates at the existing 24-bucket density", () => {
    const buckets = buildPingBuckets(
      {
        metricIntervalMs: 2 * MINUTE_MS,
        samples: Array.from({ length: 31 }, (_, index) => ({
          time: WINDOW_START + index * 2 * MINUTE_MS,
          value: 30,
          count: 2,
          loss: 0,
        })),
      },
      24,
      NOW,
    );

    expect(buckets).toHaveLength(24);
    expect(buckets.every((bucket) => bucket.total > 0)).toBe(true);
  });

  it("preserves the legacy fixed bucket count when interval metadata is absent", () => {
    const buckets = buildPingBuckets(
      {
        samples: [{ time: NOW - MINUTE_MS, value: 25 }],
      },
      18,
      NOW,
    );

    expect(buckets).toHaveLength(18);
    expect(buckets.filter((bucket) => bucket.total > 0)).toHaveLength(1);
  });
});

function pingOverviewResponse(taskId: number, value: number) {
  return {
    records: [
      {
        task_id: taskId,
        time: NOW,
        value,
        client: "node-a",
        count: 1,
        loss: 0,
      },
    ],
    tasks: [
      {
        id: taskId,
        interval: 60,
        name: `Task ${taskId}`,
        loss: 0,
        clients: ["node-a"],
        type: "icmp",
        target: "example.com",
        weight: taskId,
      },
    ],
    stats: [],
    intervalSeconds: 60,
  };
}

describe("homepage ping polling selection", () => {
  it("keeps large/compact and mini/list in their shared request modes", () => {
    expect(resolveHomepagePingRequestMode("large", true, [1, 2, 3])).toBe("multi");
    expect(resolveHomepagePingRequestMode("compact", true, [1, 2, 3])).toBe("multi");
    expect(resolveHomepagePingRequestMode("mini", true, [1, 2, 3])).toBe("single");
    expect(resolveHomepagePingRequestMode("list", true, [1, 2, 3])).toBe("single");
    expect(resolveHomepagePingRequestMode("large", false, [1, 2, 3])).toBe("single");
    expect(resolveHomepagePingRequestMode("large", true, [1, 2])).toBe("single");
  });

  it("loads multi-ping with one batched overview request and splits by task", async () => {
    let calls = 0;
    let seenOptions:
      | { includeStats?: boolean; repairBoundary?: boolean; entityIds?: string[] }
      | undefined;
    const first = await buildPingOverviewMap(
      1,
      ["node-a"],
      {},
      [1, 2, 3],
      undefined,
      undefined,
      async (_hours, taskId, options) => {
        calls += 1;
        expect(taskId).toBeUndefined();
        seenOptions = {
          includeStats: options?.includeStats,
          repairBoundary: options?.repairBoundary,
          entityIds: options?.entityIds,
        };
        return {
          records: [
            ...pingOverviewResponse(1, 10).records,
            ...pingOverviewResponse(2, 20).records,
            ...pingOverviewResponse(3, 30).records,
          ],
          tasks: [
            ...pingOverviewResponse(1, 10).tasks,
            ...pingOverviewResponse(2, 20).tasks,
            ...pingOverviewResponse(3, 30).tasks,
          ],
          stats: [],
          intervalSeconds: 60,
        };
      },
    );

    expect(calls).toBe(1);
    expect(seenOptions).toEqual({
      includeStats: false,
      repairBoundary: false,
      entityIds: ["node-a"],
    });
    expect(first.multiLines.get("node-a")?.map((line) => line.lastValue)).toEqual([
      10,
      20,
      30,
    ]);
    expect(first.multiLines.get("node-a")?.map((line) => line.taskName)).toEqual([
      "Task 1",
      "Task 2",
      "Task 3",
    ]);
  });

  it("retains previous multi-ping lines when the batched request fails", async () => {
    const first = await buildPingOverviewMap(
      1,
      ["node-a"],
      {},
      [1, 2, 3],
      undefined,
      undefined,
      async () => ({
        records: [
          ...pingOverviewResponse(1, 10).records,
          ...pingOverviewResponse(2, 20).records,
          ...pingOverviewResponse(3, 30).records,
        ],
        tasks: [
          ...pingOverviewResponse(1, 10).tasks,
          ...pingOverviewResponse(2, 20).tasks,
          ...pingOverviewResponse(3, 30).tasks,
        ],
        stats: [],
        intervalSeconds: 60,
      }),
    );

    const second = await buildPingOverviewMap(
      1,
      ["node-a"],
      {},
      [1, 2, 3],
      undefined,
      first,
      async () => {
        throw new Error("temporary batch failure");
      },
    );

    expect(first.multiLines.get("node-a")?.map((line) => line.lastValue)).toEqual([
      10,
      20,
      30,
    ]);
    expect(second.multiLines.get("node-a")?.map((line) => line.lastValue)).toEqual([
      10,
      20,
      30,
    ]);
    expect(second.multiLines.get("node-a")?.[1]?.taskName).toBe("Task 2");
  });

  it("propagates polling cancellation to an in-flight request", async () => {
    const controller = new AbortController();
    let requestSignal: AbortSignal | undefined;
    const pending = buildPingOverviewMap(
      1,
      ["node-a"],
      { 8: ["node-a"] },
      [],
      controller.signal,
      undefined,
      async (_hours, taskId, options) => {
        requestSignal = options?.signal;
        await new Promise<void>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
        return pingOverviewResponse(taskId ?? 0, 80);
      },
    );

    await Promise.resolve();
    controller.abort();
    const result = await pending;

    expect(requestSignal?.aborted).toBe(true);
    expect(result.singleItems.get("node-a")?.lastValue).toBeNull();
  });

  it("uses the lean overview options on the single-task homepage path", async () => {
    let seen: { includeStats?: boolean; repairBoundary?: boolean } | undefined;
    await buildPingOverviewMap(
      1,
      ["node-a"],
      { 8: ["node-a"] },
      [],
      undefined,
      undefined,
      async (_hours, taskId, options) => {
        seen = {
          includeStats: options?.includeStats,
          repairBoundary: options?.repairBoundary,
        };
        return pingOverviewResponse(taskId ?? 8, 42);
      },
    );

    expect(seen).toEqual({ includeStats: false, repairBoundary: false });
  });
});

