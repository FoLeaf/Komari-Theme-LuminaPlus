// NodeCard、CompactNodeCard 之间共享的非视觉逻辑。两张卡刻意用不同的 class
// 名和布局,所以 markup 不共享——只共享逻辑和文案,否则改一处另一处会漂移。

import { trimFixed } from "@/utils/format";

/** 卡片标签行的完整 tag 列表 tooltip(几种卡片布局共用同一文案)。 */
export function joinTagTitle(tags: { label: string }[]) {
  return tags.map((tag) => tag.label).join(" / ");
}

/** 卡片指标百分比的展示格式:≥10% 取整,否则保留 1 位小数。紧凑卡使用这套精度规则,
 * 避免同一节点在不同卡片上因四舍五入方式不同而数字不一致。 */
export function formatCompactPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value >= 10) return `${Math.round(value)}%`;
  return `${trimFixed(value, 1)}%`;
}

/** 卡片到期文案:"余 X天";无到期时 "余 --"。 */
export function formatCompactExpire({ value, unit }: { value: string; unit: string }) {
  if (value === "—") return "余 --";
  return unit ? `余 ${value}${unit}` : value;
}

/** 卡片在线时长文案,离线或秒数非法时返回空串(调用方据此跳过整行渲染)。 */
export function formatCompactUptime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const days = seconds / 86400;
  const value = days >= 1 ? Math.floor(days).toString() : trimFixed(days, 2);
  return `在线：${value}天`;
}

/**
 * 卡片首页 ping 区块的空状态文案。绑定了首页 Ping 任务但还没有成功样本的节点显示
 * "无样本";未绑定的节点显示"未配置"。共享以防 NodeCard 和 CompactNodeCard 措辞
 * 漂移。`title` 是较长的标题形式(仅 NodeCard 用);`text` 是两张卡都用的内联占位符。
 */
export function pingEmptyLabels(hasHomepagePingBinding: boolean): { title: string; text: string } {
  return hasHomepagePingBinding
    ? { title: "暂无有效样本", text: "无样本" }
    : { title: "未配置首页 Ping", text: "未配置" };
}

/**
 * 列表档"系统"列文案:干净的发行版名(osName)拼上原始 os 串里的第一个版本号,得到
 * 形如「Debian 12」「Ubuntu 22.04」的短标签。版本号截到 major.minor,不罗列 patch/代号
 * (原始串常是 "Debian GNU/Linux 12 (bookworm)" 这种);没有版本号时只显示发行版名。
 */
export function formatOsLabel(osName: string, rawOs?: string | null): string {
  if (!rawOs) return osName;
  const match = rawOs.match(/\d+(?:\.\d+)?/);
  return match ? `${osName} ${match[0]}` : osName;
}

/** 节点卡片头部"查看实例详情"链接的 title 和 aria-label。 */
export function nodeDetailLinkLabels(name: string, osName: string) {
  return {
    title: `${osName} · 查看详情`,
    ariaLabel: `查看 ${name} 详情，系统 ${osName}`,
  };
}

/**
 * 流量/配额条"至少给点视觉提示"的下限比例,以"一段的几分之几"表达(两张卡都是 18 段)。
 * 用量非零但极小时,以前是直接点亮/填满整段(1/18≈5.6%),把 0.01% 的用量夸张成 5.6%；
 * 现在改成只点亮一段的这个比例(段内一道细边),既能看出"用过一点",又不会失真。
 * 大卡(离散 span)和小卡(单元素渐变遮罩)实现方式不同,但共用这同一个比例语义。
 */
export const TRAFFIC_SLIVER_RATIO = 0.1;

// LatencyBars(延迟)和 QualityBars(丢包)共享的柱状条几何/命中检测。两者都渲染
// 定数量的 canvas 柱子行,所以 slot 计算和柱宽/间距必须保持一致。

/** 指针 offset 落在哪个 slot(0..count-1),没有柱子时返回 null。 */
export function getBarSlot(offsetX: number, width: number, count: number): number | null {
  if (count === 0 || width <= 0) return null;
  const slotWidth = width / count;
  return Math.max(0, Math.min(count - 1, Math.floor(offsetX / slotWidth)));
}

/** 跨 `width` px、含 `count` 根柱子的条形,每根柱宽和柱间间距。 */
export function getBarGeometry(width: number, count: number): { gap: number; barWidth: number } {
  const gap = count > 48 ? 1 : 2;
  const barWidth = Math.max(1, (width - gap * (count - 1)) / Math.max(1, count));
  return { gap, barWidth };
}
