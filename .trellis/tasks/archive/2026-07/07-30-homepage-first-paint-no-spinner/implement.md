# Implement: Homepage first paint without spinner

## Checklist

1. [x] `src/components/shell/AppShell.tsx`
   - Home: no full-main spinner for config/auth/hydrate; mount Outlet immediately.
   - Other data routes may still access-spinner.
   - `canHydrateHome` optimistic while config pending; private only when logged in.
2. [x] `src/components/node/NodeGrid.tsx` (+ optional small placeholder helper)
   - Cold path on `!storeHydrated` only (not `!isReady` → null).
   - Fixed N light-pulse cards + overview pulse; defaults before config.
   - No live zero-value overview pre-hydrate.
   - Error / empty / hydrated paths preserve existing product copy.
3. [x] Card placeholder geometry
   - Reuse existing per-mode loading shells (`NodeCard` / compact / mini / list) or shared presentational wrappers with stable min-heights.
   - Default N: large/compact **6**, mini/list **8** (adjust only if visual review demands).
4. [x] `src/pages/Home.tsx` + theme-manage
   - Keep FloatingControls behind `homeReady` (ready + hydrated).
   - Theme manage: `ThemeManageSkeleton` for auth / Suspense / configLoading; AppShell skips access spinner for `?view=theme-manage`.
5. [x] CSS only if needed
   - Prefer existing `animate-pulse` / card classes; add min-height tokens only if shells collapse.
6. [x] Tests
   - Update `src/styles/__tests__/homeLayout.test.ts` shell + NodeGrid contracts.
   - Ensure multiping-focused suites still pass if touched indirectly.
7. [x] Validation
   - `npx vitest run src/styles/__tests__/homeLayout.test.ts` (+ any new)
   - `npm run typecheck` / `npm run lint`

## Validation

```bash
npx vitest run src/styles/__tests__/homeLayout.test.ts
npx vitest run src/hooks/__tests__/usePingOverview.test.ts
npm run typecheck
npm run lint
```

Manual: cold open `/` — no full-main spinner after config; see fixed-N pulse cards; then real nodes. Private site logged-out — lock gate only.

## Review gates

- Shell spinner no longer waits on `wsStore.hydrated` for home.
- Access / private / config-error paths unchanged in intent.
- Fixed N light pulse only; no shimmer / lazy / virtual list.
- Multi-ping lean + cold pulse intact.
- homeLayout contracts updated intentionally (not deleted without replacement).

## Rollback

Revert `AppShell.tsx`, `NodeGrid.tsx` (and helper/CSS/tests). Restore prior `isCheckingHomeData` spinner OR.
