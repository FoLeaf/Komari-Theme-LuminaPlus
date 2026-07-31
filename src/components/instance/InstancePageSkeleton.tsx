import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ChartSkeletonBody } from "./ChartSkeletonBody";
import { InstancePanel } from "./InstancePanel";

/**
 * Instance cold / meta wait skeleton: structure first (back + detail + chart),
 * light pulse only — no Spinner.
 */
export function InstancePageSkeleton() {
  return (
    <div
      className="flex flex-col gap-5 py-2"
      aria-busy
      data-instance-page-skeleton
    >
      <Link to="/" className="instance-page-back">
        <ChevronLeft size={14} />
        返回
      </Link>

      <InstancePanel title="">
        <div className="flex flex-col gap-4" aria-hidden>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="skeleton-bone h-3 w-24 animate-pulse rounded" />
              <div className="skeleton-bone h-7 w-48 max-w-full animate-pulse rounded" />
              <div className="skeleton-bone h-4 w-full max-w-md animate-pulse rounded" />
            </div>
            <div className="skeleton-bone h-16 w-28 animate-pulse rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="skeleton-bone h-16 animate-pulse rounded-xl"
              />
            ))}
          </div>
        </div>
      </InstancePanel>

      <div className="instance-chart-controls" aria-hidden>
        <div className="flex flex-wrap gap-2">
          <div className="skeleton-bone h-9 w-20 animate-pulse rounded-full" />
          <div className="skeleton-bone h-9 w-16 animate-pulse rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="skeleton-bone h-9 w-14 animate-pulse rounded-full"
            />
          ))}
        </div>
      </div>

      <InstancePanel title="负载图表" className="instance-chart-panel">
        <ChartSkeletonBody />
      </InstancePanel>
    </div>
  );
}
