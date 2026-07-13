import { describe, expect, it } from "vitest";
import type { PingTaskStats } from "@/types/komari";
import {
  mergePingMetricSeries,
  pingTasksFromMetricStats,
  resolvePingChartInterval,
  PING_LATENCY_METRIC,
  PING_LOSS_METRIC,
  type PingMetricSeries,
} from "@/utils/pingMetrics";

const CLIENT = "node-a";
const TIME = "2026-07-13T02:00:00Z";

function series(
  metricKey: string,
  value: number | null,
  count: number,
): PingMetricSeries {
  return {
    metricKey,
    client: CLIENT,
    tags: { task_id: "7" },
    points: [{ time: TIME, value, count }],
  };
}

describe("mergePingMetricSeries", () => {
  it("restores the successful-sample latency average from rollup loss metadata", () => {
    // 原始值 50/60/70/80/-1：metric latency 的全样本均值为 51.8，loss=20%。
    const records = mergePingMetricSeries([
      series(PING_LATENCY_METRIC, 51.8, 5),
      series(PING_LOSS_METRIC, 0.2, 5),
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      client: CLIENT,
      task_id: 7,
      time: TIME,
      count: 5,
      loss: 20,
    });
    expect(records[0].value).toBeCloseTo(65, 8);
  });

  it("keeps an all-loss bucket as a real gap but drops fill_empty buckets", () => {
    const allLost = mergePingMetricSeries([
      series(PING_LATENCY_METRIC, null, 2),
      series(PING_LOSS_METRIC, 1, 2),
    ]);
    expect(allLost).toHaveLength(1);
    expect(allLost[0]).toMatchObject({ value: -1, count: 2, loss: 100 });

    const empty = mergePingMetricSeries([
      series(PING_LATENCY_METRIC, null, 0),
      series(PING_LOSS_METRIC, null, 0),
    ]);
    expect(empty).toEqual([]);
  });
});

describe("resolvePingChartInterval", () => {
  it("uses the 7-day rollup interval instead of splitting points by the raw task cadence", () => {
    expect(resolvePingChartInterval(15 * 60, 60)).toBe(15 * 60);
    expect(resolvePingChartInterval(undefined, 60)).toBe(60);
  });
});

describe("pingTasksFromMetricStats", () => {
  it("deduplicates per-client stats into one task and preserves assigned clients", () => {
    const base: PingTaskStats = {
      client: CLIENT,
      taskId: 7,
      name: "广州探测",
      type: "icmp",
      interval: 60,
      total: 10,
      valid: 9,
      loss: 10,
      min: 20,
      max: 80,
      avg: 40,
      latest: 35,
      p50: 36,
      p99: 79,
      stddev: 5,
      p99P50Ratio: 1.1,
    };

    const tasks = pingTasksFromMetricStats([
      base,
      { ...base, client: "node-b", loss: 0 },
    ]);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 7,
      name: "广州探测",
      interval: 60,
      clients: [CLIENT, "node-b"],
    });
  });
});
