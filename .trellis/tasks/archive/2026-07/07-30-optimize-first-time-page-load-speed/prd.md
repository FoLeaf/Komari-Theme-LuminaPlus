# optimize-first-time-page-load-speed-software-side

## Goal

Improve the first-time page load speed (FCP, TTI, bundle size) for new users visiting the webpage, using only software-level (client-side, build-time, code) optimizations beyond any CDN or infrastructure changes.

## Requirements

- Research and select the highest-impact software-level optimizations for a React + Vite + React Router app (code splitting, lazy loading, React memoization, image/font optimization, critical CSS, bundle analysis, etc.).
- Implement the selected optimizations in the existing codebase (src/, vite.config.ts or equivalent, index.html, etc.).
- Maintain or improve existing performance metrics and tests.
- Ensure changes are compatible with current stack (React 19, TanStack Query, wsStore, etc.).
- Document the changes and any new performance budgets or monitoring.

## Acceptance Criteria

- Initial JS bundle size is reduced by at least 20-30% (verified via bundle analyzer).
- First Contentful Paint is faster (measurable via Lighthouse or browser dev tools in a fresh browser).
- All non-critical routes/components use React.lazy + Suspense where appropriate.
- Critical assets are preloaded or have proper fetchpriority.
- No new dependencies added; existing Vite optimizations are maximized.
- Tests pass and no regressions in build or lint.

## Out of Scope

- Server-side changes, CDN configuration, network-level optimizations (e.g., HTTP/2, compression beyond what's enabled).
- Real-time metrics dashboards or A/B testing infrastructure.
- Third-party script removal unless it directly impacts bundle size.

## Background

Previous work on homepage-first-paint-no-spinner focused on spinner removal and skeleton loading. This task builds on that foundation for even faster initial paint for cold starts.
