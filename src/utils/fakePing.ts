import type { PingOverviewItem } from "@/types/komari";

// 未绑定首页 Ping 任务的节点用这份前端生成的"模拟延迟"填充卡片,避免与已绑定节点
// 混排时出现"未配置"占位的视觉断层。数据纯属展示:值域固定 1-10ms、丢包恒为 0,
// 不发任何请求,也不代表真实网络质量。是否启用由主题设置 fakePingForUnbound 决定。

// 覆盖最近一小时、每分钟一个样本 —— 与真实 ping 任务的常见采样密度一致,
// 经 usePingBuckets 聚合成首页 24 桶后每桶 2-3 个样本,柱状形态与真实数据无异。
const FAKE_SAMPLE_COUNT = 60;
const MINUTE_MS = 60_000;
export const FAKE_PING_MIN_MS = 1;
export const FAKE_PING_MAX_MS = 10;

// FNV-1a:把 uuid 折叠成 32 位种子,让每个节点的假曲线形态互不相同。
function hashUuid(uuid: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < uuid.length; i++) {
    hash ^= uuid.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// splitmix32 终混:同一 (seed, slot) 永远得到同一个 [0,1) 值。刻意不用 Math.random(),
// 否则每次渲染都会重掷导致柱子闪烁(StrictMode 还会双渲染),分钟推进时整条曲线也会被重画。
function unitAt(seed: number, slot: number) {
  let h = (seed ^ Math.imul(slot, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h = (h ^ (h >>> 15)) >>> 0;
  return h / 0x100000000;
}

/**
 * 生成未绑定节点的模拟 PingOverviewItem。`minuteIndex` 是绝对分钟槽
 * (Math.floor(now / 60000)):每个点的值由 (uuid, 所在分钟槽) 唯一确定,所以分钟
 * 推进时序列整体前移一格、只新增最新一个点,与真实数据的滚动窗口行为一致。
 */
export function buildFakePingItem(uuid: string, minuteIndex: number): PingOverviewItem {
  const seed = hashUuid(uuid);
  const span = FAKE_PING_MAX_MS - FAKE_PING_MIN_MS + 1;
  const samples = new Array<{ time: number; value: number }>(FAKE_SAMPLE_COUNT);
  let max = 1;
  let lastValue = FAKE_PING_MIN_MS;

  for (let i = 0; i < FAKE_SAMPLE_COUNT; i++) {
    const slot = minuteIndex - (FAKE_SAMPLE_COUNT - 1) + i;
    const value = FAKE_PING_MIN_MS + Math.floor(unitAt(seed, slot) * span);
    // 样本放在整分钟边界:一定 <= now,且最旧样本仍落在聚合的 1 小时窗口内。
    samples[i] = { time: slot * MINUTE_MS, value };
    if (value > max) max = value;
    lastValue = value;
  }

  return {
    client: uuid,
    isAssigned: true,
    lastValue,
    samples,
    max,
    loss: 0,
  };
}
