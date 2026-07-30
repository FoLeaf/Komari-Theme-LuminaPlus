# Implement: Homepage multi-ping first paint

## Checklist

1. [x] `src/services/api.ts`
   - Wired `PingOverviewOptions` into `getPingOverview`.
   - Default homepage path: `includeStats: false`, `repairBoundary: false`.
   - TaskId-less metric query works for multi-task batch (no tags filter).
   - Detail `getPingRecords` unchanged.
2. [x] `src/hooks/usePingOverview.ts`
   - Multi mode: one overview fetch; split by task client-side.
   - Single mode: lean overview options.
   - `usePingOverviewHydrated` for cold-start consumers.
   - Failure retention + empty state semantics.
3. [x] `src/hooks/useNodeCardModel.ts`
   - Exposes `homepagePingColdStart`.
4. [x] `src/components/node/MultiPingStatus.tsx` + CSS + card wiring
   - Cold-start light pulse placeholders.
   - Fixed three-slot height (large + compact).
   - Empty values show「无样本」.
5. [x] Tests
   - api lean defaults + multi batch without tags.
   - usePingOverview multi→1 request, batch failure retention, single lean options.
6. [x] Validation
   - `vitest` focused suites: 18 passed
   - `tsc --noEmit`: clean

## Validation

```bash
npx vitest run src/services/__tests__/api.test.ts src/hooks/__tests__/usePingOverview.test.ts
npx tsc --noEmit
```

## Review gates

- Multi-ping primary path: 1 metric query, 0 stats, 0 repair.
- Detail path still independent.
- Cold pulse only once; poll silent.
- F5 cold; memory cache only.

## Rollback

Revert changes under `src/services/api.ts`, `src/hooks/usePingOverview.ts`, card model/UI/CSS, and related tests.
