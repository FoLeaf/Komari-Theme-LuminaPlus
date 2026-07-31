# spinner-to-skeleton-home-instance

## Goal

Eliminate remaining **explicit spinner waits** on (1) cold homepage first paint without browser cache and (2) node instance detail chart type / time-window switches. Replace them with **light-pulse skeleton** placeholders consistent with existing home / theme-manage cold-start patterns so the UI feels structured immediately and fills in when data arrives.

## Background / Confirmed facts

### Issue 1 — Homepage cold first paint still shows spinner

- Prior task `07-30-homepage-first-paint-no-spinner` removed AppShell full-main spinner for home and painted `HomeBrand` + `HomeOverviewPlaceholder` + `HomePlaceholderGrid` inside `NodeGrid` before hydrate.
- Subsequent task `07-30-optimize-first-time-page-load-speed` made **Home lazy** in `src/router.tsx` via `lazy(() => import("@/pages/Home"))` and wrapped it with `suspended()`, whose fallback is **`LoadingFallback` → centered `<Spinner />`**.
- On a cold visit with no browser cache, the Home JS chunk has not arrived yet → React Suspense shows the router spinner **before** any home skeleton can paint. This is the remaining first-screen spinner for `/`.
- AppShell already sets `skipAccessSpinner` for the home dashboard; once the Home chunk loads, NodeGrid cold branch is skeleton-based.

### Issue 2 — Instance chart / range switches still show spinner

- `src/components/instance/InstancePanel.tsx` → `InstanceChartLoading` renders panel title + **`<Spinner size={26} />` + “加载中…”**.
- `LoadChart` and `PingChart` return `InstanceChartLoading` when query `isLoading` (initial load and when switching time windows / chart data keys force a loading state).
- `src/pages/Instance.tsx` shows a full centered **`<Spinner size={24} label="正在加载实例" />`** while node meta is not yet available (store not hydrated / meta missing).
- Instance route itself is also lazy + `suspended()` with the same Spinner Suspense fallback while the Instance chunk loads.

### Existing conventions to reuse

- Light pulse only (no strong shimmer, no virtual list) — locked in prior homepage tasks.
- Fixed geometry / reserved chart height to limit CLS.
- Contract tests live in `src/styles/__tests__/homeLayout.test.ts`; extend or add instance chart contract coverage as needed.

## Requirements

1. **Home cold path**: Visiting `/` with empty cache must not show a centered full-area Spinner while waiting for the Home route chunk or home first paint. Prefer eager Home (or a home-shaped Suspense fallback that reuses the same placeholder structure) so skeleton structure paints immediately after AppShell mounts.
2. **Home post-chunk**: Existing NodeGrid fixed-N placeholders and AppShell `skipAccessSpinner` remain; no regression to full-page spinner for config/hydrate.
3. **Instance route entry**: While Instance chunk or node meta is loading, show instance-shaped skeleton (back link + detail shell + chart panel skeleton), not a lone Spinner.
4. **Chart type switch (load ↔ ping)** and **time-window switch**: While chart data is loading/refetching into empty state, show chart-area skeleton (pulse panel matching chart stage height) instead of `InstanceChartLoading` Spinner + “加载中…”.
5. Keep error/retry affordances (failed load, missing instance after hydrate) as explicit messages/buttons — not skeleton forever.
6. Style stays light-pulse / structural; no new heavy animation library.

## Acceptance Criteria

- [ ] Cold open `/` (hard refresh / empty cache): no full-area centered Spinner before home structure appears; user sees home skeleton (brand / overview / card placeholders or equivalent) as soon as shell paints.
- [ ] After Home chunk + hydrate, real cards replace placeholders without re-introducing a full-page Spinner.
- [ ] Open node detail (`/instance/:uuid`): no lone Spinner for chunk load or meta wait; instance skeleton is visible.
- [ ] Switch 负载 ↔ Ping: chart stage shows skeleton, not Spinner, while the target chart’s first data is pending.
- [ ] Switch time window on load or ping chart: chart stage shows skeleton (or keep previous chart with non-blocking busy if preferred for zero-empty), **not** Spinner + “加载中…”.
- [ ] Hard errors (config, missing instance after hydrate, chart fetch error) still show clear copy + retry, not infinite skeleton.
- [ ] Typecheck, lint, and relevant contract/unit tests pass; home layout contracts still green.

## Out of Scope

- Assets / Traffic / ThemeManage list spinners (unless they share a component we must touch).
- CDN / server / HTTP caching.
- Virtualized charts or changing chart data APIs.
- Strong e-commerce shimmer or redesign of Instance chrome beyond loading states.
- Button-inline busy spinners on Save / small action buttons (e.g. ThemeManage save).

## Key decisions (locked from prior work + this request)

| Decision | Choice |
|----------|--------|
| Skeleton style | Light pulse, fixed geometry (same as home cold start) |
| Home Suspense spinner | Remove; eager Home and/or home skeleton fallback |
| Chart loading UI | Replace `InstanceChartLoading` Spinner with chart skeleton |
| Instance meta wait | Instance page skeleton, not Spinner |
| Keep spinner for | True errors’ secondary actions only if already used as button busy indicators |

## Risks

- Eager Home slightly increases main entry graph size vs pure lazy; acceptable for first-paint UX (primary product surface).
- If `isFetching` (refetch with cached data) still blanks the chart, skeleton should only apply when there is **no displayable data** (`isLoading` / no previous series), not on every background refetch — avoid flicker.
