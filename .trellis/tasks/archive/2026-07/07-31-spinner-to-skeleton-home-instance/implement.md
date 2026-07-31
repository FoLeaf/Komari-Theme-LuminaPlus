# Implement: spinner-to-skeleton-home-instance

## Ordered checklist

### A. Homepage cold spinner (Issue 1)

1. In `src/router.tsx`:
   - Statically import `Home` from `@/pages/Home`.
   - Index route: `element: <Home />` (no `suspended` / no Spinner fallback).
   - Leave other routes lazy + Suspense as today (or upgrade Instance fallback in step B).
2. Update `src/styles/__tests__/homeLayout.test.ts` (or router-focused assertion) so Home is not gated by Spinner Suspense fallback.
3. Manually verify: hard refresh `/` → skeleton home structure, no centered Spinner flash before structure.

### B. Instance page + chart skeletons (Issue 2)

1. Add instance page skeleton UI (new component or functions in `Instance.tsx` / `components/instance/`):
   - Back link placeholder row, detail header/body pulse, chart control pulse, chart stage pulse.
2. `Instance.tsx`: replace meta-wait `<Spinner />` with page skeleton; keep post-hydrate not-found / error copy.
3. `router.tsx`: Instance lazy fallback → instance page skeleton (not Spinner).
4. `InstancePanel.tsx`: rewrite `InstanceChartLoading` to light-pulse chart skeleton (no Spinner, no “加载中…” spinner pair).
5. Confirm `LoadChart` / `PingChart` still use `InstanceChartLoading` on `isLoading`; adjust only if fetching-with-data blanks incorrectly.
6. Add/adjust CSS if needed (reuse `instance-chart-loading` / `animate-pulse` / surface tokens).
7. Add or extend a small source/contract test for no Spinner in chart loading path.

### C. Validation

```bash
npm run typecheck
npm run lint -- --max-warnings=0
npm test -- src/styles/__tests__/homeLayout.test.ts
# plus any new instance skeleton tests
```

### D. Spec / finish

- If a durable rule emerges (“route Suspense fallbacks for primary surfaces must be skeletons”), update `.trellis/spec/frontend/` via `trellis-update-spec`.
- Phase 3.4 commit → `/trellis-finish-work`.

## Risky files

| File | Risk |
|------|------|
| `src/router.tsx` | Easy to reintroduce Spinner fallback on Home |
| `src/pages/Instance.tsx` | Meta vs not-found branch mix-up |
| `LoadChart.tsx` / `PingChart.tsx` | Skeleton on every isFetching → flicker |
| `homeLayout.test.ts` | Stale spinner contracts |

## Rollback points

- After A only: Home eager again; Instance still spinner (partial ship OK).
- After B: full scope; revert InstancePanel if chart layout breaks.

## Ready for `task.py start` when

- User approves this planning summary.
- `implement.jsonl` / `check.jsonl` curated (sub-agent platform).
