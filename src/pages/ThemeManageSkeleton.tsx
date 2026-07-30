import { memo as ReactMemo } from "react";

/** 主题设置冷启动骨架：轻量 pulse，替代全页 Spinner（auth / lazy / config）。 */
const ThemeManageSkeleton = ReactMemo(function ThemeManageSkeleton() {
  return (
    <div
      className="theme-manage flex flex-col gap-5 py-2"
      aria-busy
      data-theme-manage-skeleton
    >
      <header className="theme-masthead">
        <div className="theme-masthead-topline">
          <div
            className="h-8 w-24 animate-pulse rounded-full bg-[var(--surface-elev)]"
            aria-hidden
          />
          <div className="theme-manage-toolbar-actions">
            <div
              className="h-9 w-[4.5rem] animate-pulse rounded-full bg-[var(--surface-elev)]"
              aria-hidden
            />
            <div
              className="h-9 w-[5.5rem] animate-pulse rounded-full bg-[var(--surface-elev)]"
              aria-hidden
            />
          </div>
        </div>
        <div className="theme-masthead-main">
          <div className="theme-masthead-headings gap-2">
            <div
              className="h-3 w-44 animate-pulse rounded bg-[var(--surface-elev)]"
              aria-hidden
            />
            <div
              className="h-7 w-40 animate-pulse rounded bg-[var(--surface-elev)]"
              aria-hidden
            />
            <div
              className="h-4 max-w-md w-full animate-pulse rounded bg-[var(--surface-elev)]"
              aria-hidden
            />
          </div>
          <dl className="theme-masthead-meta" aria-hidden>
            <div className="min-h-[3.25rem] animate-pulse rounded-lg bg-[var(--surface-elev)]" />
            <div className="min-h-[3.25rem] animate-pulse rounded-lg bg-[var(--surface-elev)]" />
          </dl>
        </div>
      </header>
      {[0, 1, 2, 3].map((index) => (
        <section
          key={index}
          className="instance-panel theme-manage-skeleton-panel animate-pulse"
          aria-hidden
        />
      ))}
    </div>
  );
});

export { ThemeManageSkeleton };
export default ThemeManageSkeleton;
