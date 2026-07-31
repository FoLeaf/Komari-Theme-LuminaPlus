# Design: spinner-to-skeleton-home-instance

## Architecture / boundaries

Two independent loading surfaces share one product rule: **structure first, fill later; never a lone Spinner for wait states on home or instance charts.**

```
AppShell (skipAccessSpinner on home)
  └─ Outlet
       ├─ Home  ← must not Suspense→Spinner
       │    └─ NodeGrid cold placeholders (already done)
       └─ Instance
            ├─ meta pending → InstancePageSkeleton
            ├─ chart controls always visible when meta ready
            └─ LoadChart / PingChart isLoading → ChartSkeleton (not Spinner)
```

## 1. Homepage cold Suspense path

**Root cause:** `src/router.tsx` `HomePage = lazy(...)` + `suspended()` → `LoadingFallback` Spinner.

**Preferred fix (recommended):**

- Import `Home` **eagerly** (static import) for the index route only.
- Keep Instance / Assets / Traffic / NotFound lazy.
- Drop Suspense around Home, or keep a no-op wrapper without Spinner.

**Fallback alternative** (if bundle size regression is measured and unacceptable):

- Keep Home lazy but replace `LoadingFallback` for the index route with a lightweight `HomeRouteSkeleton` that mirrors NodeGrid cold structure (brand bar + overview pulse + N card pulses). Prefer extracting shared presentational pieces to avoid duplicating NodeGrid logic.

**Recommendation:** eager Home. Homepage is the primary cold-entry surface; previous lazy Home change regressed first-paint UX.

## 2. Instance page entry

**Files:** `src/pages/Instance.tsx`, possibly new `InstanceSkeleton.tsx` or co-located helpers.

While `!meta` and store not yet hydrated / no hard error:

- Paint: back link row + detail panel pulse blocks + chart controls pulse + chart stage pulse.
- On hydrate + missing uuid meta: keep “实例不存在” / error copy (no skeleton).
- On `nodeInfoError`: keep error message path.

Instance route Suspense (lazy chunk):

- Replace route-level Spinner fallback for `instance/:uuid` with the same `InstancePageSkeleton` (or a thinner variant) so chunk wait also looks structural.

## 3. Chart loading

**Files:** `InstancePanel.tsx` (`InstanceChartLoading`), `LoadChart.tsx`, `PingChart.tsx`, CSS under instance styles.

Replace Spinner body with:

- Keep `InstancePanel` chrome (title).
- Chart body: fixed min-height matching current chart stage, light `animate-pulse` blocks (axis bar + plot area), `aria-busy`.
- Remove “加载中…” spinner pairing (optional short sr-only text for a11y).

**Loading vs fetching:**

- Show skeleton only when there is no usable series to display (`isLoading` or empty data on first key).
- If previous data exists and `isFetching`, prefer keep last chart + subtle busy on refresh control (existing pattern) — do not blank to skeleton on every range hop if React Query keeps `placeholderData` / previous data. If current code clears data on key change and forces `isLoading`, skeleton is correct.

## 4. Data flow

```
meta ready? ──no──► InstancePageSkeleton
         └──yes──► controls + chartType
                      │
                      ├─ load active → LoadChart(hours)
                      │                  isLoading → ChartSkeleton
                      │                  data → uPlot
                      └─ ping active → PingChart(hours)
                                         isLoading → ChartSkeleton
```

Range / type switches only remount chart data queries; shell and controls stay mounted (already true for type switch with `hidden` dual views).

## 5. Compatibility

- No API changes.
- Theme `showPingChart` gate unchanged.
- Home layout contract tests must still pass; add assertions that router Home path does not use Spinner Suspense fallback (or that Home is eager).
- Instance chart tests: source contract that `InstanceChartLoading` has no Spinner, or component-level check.

## 6. Trade-offs

| Approach | Pro | Con |
|----------|-----|-----|
| Eager Home | Zero Suspense spinner on `/` | Slightly larger initial graph |
| HomeRouteSkeleton + lazy | Keeps code-split | Duplicate skeleton markup; still one RTT before Home logic |
| Chart skeleton | Matches product language | Slightly more CSS |

## 7. Rollback

- Revert router Home import and `InstanceChartLoading` body; Instance meta Spinner restore.
