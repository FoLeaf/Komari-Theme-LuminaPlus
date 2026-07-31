/** Shared chart-body pulse used by InstanceChartLoading and page skeleton. */
export function ChartSkeletonBody() {
  return (
    <div className="instance-chart-skeleton" data-instance-chart-skeleton aria-hidden>
      <div className="instance-chart-skeleton-meta">
        <div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-elev)]" />
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-elev)]" />
        <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-elev)]" />
      </div>
      <div className="instance-chart-skeleton-plot animate-pulse" />
      <div className="instance-chart-skeleton-legend">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-2.5 w-14 animate-pulse rounded bg-[var(--surface-elev)]"
          />
        ))}
      </div>
    </div>
  );
}
