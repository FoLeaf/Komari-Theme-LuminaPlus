# Component Guidelines

> How React components are built in this theme.

---

## Overview

Components are mostly function components. List/grid cards that re-render on a 1s metrics tick use `memo` and keep heavy subtrees stable. Styling mixes Tailwind utility classes with domain CSS modules under `src/styles/`, driven by CSS variables from `tokens.css`.

---

## Patterns in use

### 1. Named function components (default)

```tsx
// src/components/node/NodeGrid.tsx
export function NodeGrid() { ... }
```

### 2. `memo` for high-frequency parents

Homepage cards re-render often via realtime metrics. Export memoized components and isolate ping/chart subtrees:

```tsx
// src/components/node/CompactNodeCard.tsx
export const CompactNodeCard = memo(function CompactNodeCard({ uuid }: { uuid: string }) {
  const model = useNodeCardModel(uuid, { pingBucketCount: HEALTH_BAR_COUNT, includeMultiPing: true });
  ...
});
```

Also: `NodeCard`, `MiniNodeCard`, `MultiPingStatus`, `OsLogo`.

### 3. View-model hook + presentational body

Cards do not fan out many store subscriptions in JSX. They call one model hook:

- `useNodeCardModel(uuid, options)` — meta, metrics, traffic, ping lines/buckets, labels
- Parent grid only maps UUIDs: `NodeGrid` → `<CompactNodeCard uuid={uuid} />`

### 4. Shared pure helpers beside UI

Cross-card format/hit-testing lives in `nodeCardShared.ts`, not copy-pasted:

- `pingEmptyLabels`, `formatCompactPercent`, `getBarSlot`, `getBarGeometry`

### 5. Canvas strips for dense bars

Latency/loss history uses `CanvasStrip` + draw callbacks (`LatencyBars`, `QualityBars`) instead of dozens of DOM bars.

### 6. `clsx` for conditional classes

```tsx
className={clsx("multi-ping-metric-head", metric === "loss" && "is-value-only")}
```

### 7. Lazy route components

Heavy pages load via `React.lazy` + `Suspense` in `router.tsx` (`Instance`, `Assets`, `NotFound`). Home stays eager.

---

## Props conventions

- Prefer explicit typed props inline or small local `interface` near the component
- Pass **stable identifiers** (`uuid`) into cards; let the card subscribe to data
- Optional behavior flags on model hooks, not deep prop drilling:
  - `includeMultiPing`, `pingBucketCount`
- Event handlers: `onHoverIndex`, `onExpandedChange` — plain functions, often `useCallback` when passed to memo children
- Avoid large inline object props that break `memo` equality every render

---

## Composition

| Layer | Responsibility |
|-------|----------------|
| `pages/*` | Auth gates, search params, suspense boundaries |
| `components/shell/*` | Chrome: layout, background, floating controls |
| `components/node/NodeGrid` | Filter/sort + overview; renders card list by UUID |
| Card components | Layout + bind model |
| Bars / badges / tooltips | Leaf visualization |

Do not nest “card inside card” for page sections. Cards are for repeated node items and framed tools only (matches existing home layout).

---

## Accessibility (actual practice)

- Interactive controls use `type="button"`, `aria-pressed`, `aria-label` where icon-only
- Multi-ping block: `role="group"` + `aria-label="三网延迟与丢包"`
- Error UI: `role="alert"` in `ErrorBoundary`
- Chart hover tooltips pair with keyboard hints on health bars (`aria-label` includes active tooltip text)
- Prefer visible text or `title` for dense metrics; do not rely on color alone for online/offline (also shapes/blocks)

---

## Styling rules observed

- Semantic colors via CSS vars: `var(--text-primary)`, `var(--status-success)`, metric tokens
- Appearance via `data-appearance` on `documentElement` (light/dark)
- Domain layout CSS in `src/styles/node-card.css`, `compact-node-card.css`, etc.
- Tailwind for one-off flex/grid/spacing utilities in JSX
- Numeric metrics often use `tabular` / `font-variant-numeric: tabular-nums`

---

## Multi-ping first paint (`MultiPingStatus`)

Homepage multi-network (三网) block perception rules:

1. **Cold start only** — light opacity pulse when `coldStart` is true (no in-memory overview hydrate yet). Poll refresh must **not** re-enter pulse.
2. **Fixed three slots** — always reserve 3 rows × latency/loss columns; use `.is-cold-start` min-height so layout does not shift (CLS).
3. **No whole-card skeleton / shimmer sweep** for this section; no virtual list for ~10-node home.
4. **Empty values** — bound-but-empty shows「无样本」(display **and** tooltip/label strings must match; do not mix `—` in one place and「无样本」in another).
5. Cards pass `coldStart={homepagePingColdStart}` from `useNodeCardModel` and still render the block when `homepagePingLines.length === 3 || homepagePingColdStart`.

---

## Theme manage cold skeleton

Entry to `/?view=theme-manage` must not full-page spin:

1. `AppShell` treats theme-manage like home for access spinner skip.
2. `Home` auth-pending and `Suspense` (lazy chunk) use `ThemeManageSkeleton` (small module `ThemeManageSkeleton.tsx` — do not static-import full `ThemeManage` from Home).
3. `ThemeManage` `configLoading` returns the same skeleton, not centered `Spinner`.
4. Save button may still use a tiny inline spinner; section lists may keep compact loading — entry path is skeleton-first.

---

## Homepage cold grid placeholders (`NodeGrid`)

When theme is ready and the node store is **not** hydrated (and no `nodeInfoError`):

1. Paint structural home early: brand + optional overview **pulse shell** (not live zero-value overview numbers).
2. Render **fixed N** presentational card shells for the current view mode (`HOME_PLACEHOLDER_COUNT`: large/compact **6**, mini/list **8`).
3. Reuse existing loading shells with **reserved min-heights** (large ~438, compact ~284, mini ~228; dense overview cards ~88) — light `animate-pulse` only.
4. After hydrate, replace with real visible UUID cards; empty real list uses the existing empty-state copy (not placeholders).
5. No shimmer sweep, viewport lazy load, or virtual list on this path.

---

## Anti-patterns

- Reading `wsStore` directly from many leaf components (use hooks)
- Recalculating ping buckets in every child without `useMemo` / shared builder
- Introducing a UI component library — this theme is hand-rolled
- Giant page components that embed chart math (keep in `components/instance/chartData.ts` style modules)
- Default-export components (named exports are the norm)
- E-commerce style large gray skeleton + strong shimmer on homepage multi-ping **or** whole-home cold path
- Pulse on every poll, or omitting fixed height for the three multi-ping rows
- Full-main `Spinner` waiting solely on `wsStore.hydrated` before mounting home
- Fake store UUIDs just to mount card models during cold start
