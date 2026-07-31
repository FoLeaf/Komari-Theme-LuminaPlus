import {
  formatCacheTimeLabel,
  isCacheStale,
} from "@/services/offlineDb";
import type { OfflineDataSource } from "@/services/offlineDb";

export function OfflineBanner({
  online,
  dataSource,
  cacheSavedAt,
  failureStreak,
}: {
  online: boolean;
  dataSource: OfflineDataSource;
  cacheSavedAt: number | null;
  failureStreak: number;
}) {
  const showingCache = dataSource === "cache";
  const syncFailing = failureStreak >= 2;
  const visible =
    !online || showingCache || (syncFailing && cacheSavedAt != null);

  if (!visible) return null;

  const stale = cacheSavedAt != null && isCacheStale(cacheSavedAt);
  const timeLabel =
    cacheSavedAt != null ? formatCacheTimeLabel(cacheSavedAt) : null;

  let title = "离线模式";
  if (online && showingCache) title = "无法同步";
  else if (online && syncFailing) title = "连接不稳";

  let detail = "展示本地缓存数据";
  if (timeLabel) {
    detail = stale
      ? `数据较旧 · 截至 ${timeLabel}`
      : `数据截至 ${timeLabel}`;
  }

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div className="offline-banner-inner">
        <span className="offline-banner-title">{title}</span>
        <span className="offline-banner-detail">{detail}</span>
      </div>
    </div>
  );
}
