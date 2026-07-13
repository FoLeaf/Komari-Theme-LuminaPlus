import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Spinner } from "@/components/ui/Spinner";

export function InstancePanel({
  title,
  kicker,
  titleAction,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  /** 标题上方的编号/分区小标（如主题管理的 01·外观）。仅在传入时渲染。 */
  kicker?: ReactNode;
  /** 紧贴标题文字之后的内联控件（如详情页的服务器切换器）。 */
  titleAction?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("instance-panel", kicker != null && "has-kicker", className)}>
      <header className="instance-panel-header">
        <div className="instance-panel-headings">
          {kicker != null && <span className="instance-panel-kicker">{kicker}</span>}
          <div className="instance-panel-title-row">
            <h2 className="instance-panel-title">{title}</h2>
            {titleAction}
          </div>
          {description && <p className="instance-panel-description">{description}</p>}
        </div>
        {aside && <div className="instance-panel-aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

// 图表加载态:带标题面板 + 居中 Spinner + 文案。LoadChart/PingChart 共用,避免各写一份漂移。
export function InstanceChartLoading({ title }: { title: string }) {
  return (
    <InstancePanel title={title}>
      <div className="instance-chart-loading" aria-busy>
        <Spinner size={26} />
        <span>加载中…</span>
      </div>
    </InstancePanel>
  );
}
