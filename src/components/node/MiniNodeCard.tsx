import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  Clock3,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  MemoryStick,
  Unplug,
  Upload,
} from "lucide-react";
import { clsx } from "clsx";
import { Flag } from "@/components/ui/Flag";
import { OsLogo } from "@/components/ui/OsLogo";
import { IpStackBadges } from "./IpStackBadges";
import { MetricBar } from "./MetricBar";
import { LatencyBars } from "./LatencyBars";
import { QualityBars } from "./QualityBars";
import { useNodeCardModel } from "@/hooks/useNodeCardModel";
import { usePreferences } from "@/hooks/usePreferences";
import { useMetricColorsVersion } from "@/hooks/useMetricColors";
import { formatBytes } from "@/utils/format";
import { speedRateColor } from "@/utils/metricTone";
import { joinTagTitle, nodeDetailLinkLabels, pingEmptyLabels } from "./nodeCardShared";
import type { ByteRateDisplay } from "@/utils/format";
import type { NodeInfo, NodeMetrics, PingOverviewItem, PingOverviewBucket } from "@/types/komari";

// 迷你卡:固定极简布局,不读紧凑卡的显示开关;数据走共享的 useNodeCardModel。
const HEALTH_BAR_COUNT = 24;

type MiniNode = NodeInfo & NodeMetrics;
type MiniTag = { label: string; color: string };

function MiniHeader({ node, osName }: { node: MiniNode; osName: string }) {
  const detailLabels = nodeDetailLinkLabels(node.name, osName);
  return (
    <header className="mini-node-header">
      <Flag region={node.region} size={14} />
      <Link to={`/instance/${node.uuid}`} className="mini-node-title" title={node.name}>
        {node.name}
      </Link>
      <Link
        to={`/instance/${node.uuid}`}
        className="mini-node-os"
        title={detailLabels.title}
        aria-label={detailLabels.ariaLabel}
      >
        <OsLogo value={node.os} size={14} />
      </Link>
    </header>
  );
}

// 价格保底 chip 排最前;标签放不下的整枚隐藏,完整列表在 lane 的 tooltip。
function MiniChips({
  tags,
  renewalPrice,
  ipv4,
  ipv6,
}: {
  tags: MiniTag[];
  renewalPrice: string | null;
  ipv4?: string | null;
  ipv6?: string | null;
}) {
  if (!renewalPrice && tags.length === 0 && !ipv4 && !ipv6) return null;
  const tagTitle = joinTagTitle(tags);
  return (
    <div className="mini-node-chip-row">
      {renewalPrice && (
        <span className="mini-node-price-tag" title={`续费价格 ${renewalPrice}`}>
          <CircleDollarSign size={11} strokeWidth={2.2} />
          {renewalPrice}
        </span>
      )}
      <IpStackBadges ipv4={ipv4} ipv6={ipv6} />
      {tags.length > 0 && (
        <div className="mini-node-tag-lane" title={tagTitle}>
          {tags.map((tag, index) => (
            <span key={`${tag.label}-${index}`} className="mini-node-tag" data-tag={tag.color}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniVitals({ node, loadFraction, redrawKey }: { node: MiniNode; loadFraction: number; redrawKey: string }) {
  return (
    <div className="mini-node-vitals">
      <MetricBar
        icon={<Cpu size={12} strokeWidth={2} />}
        label="CPU"
        valueText={node.cpuPct.toFixed(node.cpuPct >= 10 ? 0 : 1)}
        unit="%"
        fraction={node.cpuPct / 100}
        redrawKey={redrawKey}
        paint="var(--progress-cpu)"
      />
      <MetricBar
        icon={<MemoryStick size={12} strokeWidth={2} />}
        label="内存"
        valueText={node.ramPct.toFixed(node.ramPct >= 10 ? 0 : 1)}
        unit="%"
        fraction={node.ramPct / 100}
        redrawKey={redrawKey}
        paint="var(--progress-memory)"
      />
      <MetricBar
        icon={<HardDrive size={12} strokeWidth={2} />}
        label="磁盘"
        valueText={node.diskPct.toFixed(node.diskPct >= 10 ? 0 : 1)}
        unit="%"
        fraction={node.diskPct / 100}
        redrawKey={redrawKey}
        paint="var(--progress-disk)"
      />
      <MetricBar
        icon={<Gauge size={12} strokeWidth={2} />}
        label="负载"
        valueText={node.load1.toFixed(2)}
        fraction={loadFraction}
        redrawKey={redrawKey}
        paint="var(--progress-load)"
      />
    </div>
  );
}

function MiniFlowRow({ icon, value, unit, color }: { icon: ReactNode; value: string; unit?: string; color?: string }) {
  return (
    <span className="mini-node-flow-row" style={color ? { color } : undefined}>
      <span className="mini-node-flow-arrow">{icon}</span>
      <strong className="tabular">
        {value}
        {unit && <small>{unit}</small>}
      </strong>
    </span>
  );
}

// 速率区:左列实时速率(速度档配色),右列累计流量;每列上传在上、下载在下。
function MiniFlow({
  node,
  upRate,
  downRate,
}: {
  node: MiniNode;
  upRate: ByteRateDisplay;
  downRate: ByteRateDisplay;
}) {
  return (
    <div className="mini-node-flow">
      <div className="mini-node-flow-group">
        <MiniFlowRow
          icon={<ArrowUp size={12} strokeWidth={2.4} />}
          value={upRate.value}
          unit={upRate.unit}
          color={speedRateColor(upRate.unit)}
        />
        <MiniFlowRow
          icon={<ArrowDown size={12} strokeWidth={2.4} />}
          value={downRate.value}
          unit={downRate.unit}
          color={speedRateColor(downRate.unit)}
        />
      </div>
      <div className="mini-node-flow-group">
        <MiniFlowRow icon={<Upload size={12} strokeWidth={2.1} />} value={formatBytes(node.trafficUp)} />
        <MiniFlowRow icon={<Download size={12} strokeWidth={2.1} />} value={formatBytes(node.trafficDown)} />
      </div>
    </div>
  );
}

// 延迟/丢包必显,复用大卡的 canvas 双柱(仅 ping 变化时重绘)。
const MiniHealth = memo(function MiniHealth({
  ping,
  pingBuckets,
  latencyColor,
  lossColor,
  hasHomepagePingBinding,
  redrawKey,
}: {
  ping: PingOverviewItem;
  pingBuckets: PingOverviewBucket[];
  latencyColor: string;
  lossColor: string;
  hasHomepagePingBinding: boolean;
  redrawKey: string;
}) {
  const { text: emptyText } = pingEmptyLabels(hasHomepagePingBinding);
  return (
    <div className="mini-node-health">
      <div className="mini-node-health-item">
        <div className="mini-node-health-head">
          <span className="mini-node-health-label">
            <Clock3 size={12} strokeWidth={2} />
            延迟
          </span>
          <strong className="mini-node-health-value tabular" style={{ color: latencyColor }}>
            {ping.lastValue != null ? (
              <>
                {Math.round(ping.lastValue)}
                <small>ms</small>
              </>
            ) : (
              <span className="mini-node-health-empty">{emptyText}</span>
            )}
          </strong>
        </div>
        <LatencyBars max={ping.max} buckets={pingBuckets} redrawKey={redrawKey} />
      </div>
      <div className="mini-node-health-item">
        <div className="mini-node-health-head">
          <span className="mini-node-health-label">
            <Unplug size={12} strokeWidth={2} />
            丢包
          </span>
          <strong className="mini-node-health-value tabular" style={{ color: lossColor }}>
            {ping.loss != null ? (
              <>
                {ping.loss.toFixed(1)}
                <small>%</small>
              </>
            ) : (
              <span className="mini-node-health-empty">{emptyText}</span>
            )}
          </strong>
        </div>
        <QualityBars buckets={pingBuckets} redrawKey={redrawKey} />
      </div>
    </div>
  );
});

export const MiniNodeCard = memo(function MiniNodeCard({ uuid }: { uuid: string }) {
  const { resolvedAppearance } = usePreferences();
  const colorsVersion = useMetricColorsVersion();
  const redrawKey = `${resolvedAppearance}:${colorsVersion}`;
  const model = useNodeCardModel(uuid, HEALTH_BAR_COUNT);

  if (!model.node) {
    return <article className="mini-node-card animate-pulse" aria-busy />;
  }

  const {
    node,
    ping,
    pingBuckets,
    footerTags,
    renewalPrice,
    latencyColor,
    lossColor,
    loadFraction,
    upRate,
    downRate,
    hasHomepagePingBinding,
    isOffline,
    osName,
  } = model;

  return (
    <article
      className={clsx("mini-node-card", isOffline && "is-offline")}
      data-appearance={resolvedAppearance}
    >
      <MiniHeader node={node} osName={osName} />
      <MiniChips tags={footerTags} renewalPrice={renewalPrice} ipv4={node.ipv4} ipv6={node.ipv6} />
      <MiniVitals node={node} loadFraction={loadFraction} redrawKey={redrawKey} />
      <MiniFlow node={node} upRate={upRate} downRate={downRate} />
      <MiniHealth
        ping={ping}
        pingBuckets={pingBuckets}
        latencyColor={latencyColor}
        lossColor={lossColor}
        hasHomepagePingBinding={hasHomepagePingBinding}
        redrawKey={redrawKey}
      />
    </article>
  );
});
