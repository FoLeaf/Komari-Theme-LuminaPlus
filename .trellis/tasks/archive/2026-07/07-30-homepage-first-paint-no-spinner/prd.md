# Homepage first paint without spinner

## Goal

Eliminate the explicit full-page spinner wait between opening the homepage URL and seeing first-screen card structure. Prefer **structure first, fill later** (same philosophy as multi-ping first paint): the page feels alive immediately with light pulse placeholders, then real node data fills in without layout thrash.

## Background / Confirmed facts

### Root cause

- `src/components/shell/AppShell.tsx` blocks the entire `<Outlet />` when `isCheckingShell`:
  - `isCheckingAccess` — `publicConfig.isPending` (and private-site `auth.isPending`)
  - `isCheckingHomeData` — home dashboard and `!wsStore.hydrated` and no `nodeInfoError`
  - UI: full-main centered `<Spinner size={24} />`
- `NodeGrid` returns `null` while `!themeSettings.isReady || !storeHydrated` (error copy only if `nodeInfoError`).
- Per-card empty shells already exist when `!model.node` (`NodeCard` minHeight 438 + `animate-pulse`, compact/mini/list equivalents).
- Existing contract test `src/styles/__tests__/homeLayout.test.ts` **requires** the shell-owned spinner for home hydration — must be updated with this task.
- Multi-ping task archived: lean batch + section-level light pulse; specs under `.trellis/spec/frontend/`.

### Dependencies on the critical path

1. Public config (theme + `private_site`)
2. wsStore first node-info hydrate
3. Private site only: auth `/api/me`

## Locked Scope

User-locked 2026-07-30.

### Perception

- **轻量占位** only (aligned with multi-ping): light pulse + fixed geometry; no strong shimmer sweep; no viewport lazy load; no virtual list.
- Cold start paints structural homepage (brand / overview / **fixed N** card placeholders) once access is allowed.
- Real list replaces placeholders; no return to full-page spinner for hydrate alone.
- **Fixed N** placeholder cards (not last-visit count, not shell-only-without-cards). Design pins exact N / heights per view mode (default recommendation: 6 grid cards for large/compact).

### Gate behavior (revised after user report 2026-07-30)

User feedback: keeping `publicConfig` full-page spinner still felt like “转圈等待”, not skeleton. Scope expanded:

- **Home dashboard**: never full-main `Spinner` for config pending, auth pending, or store hydrate. Mount `Outlet` immediately and paint fixed-N light placeholders (defaults if theme not ready).
- **Start** `retainStore` / hydrate optimistically while config is still pending (public path). Private site only hydrates when logged in.
- Private unauthenticated (confirmed): lock gate only — may briefly flash placeholders before config resolves private (accepted).
- Config hard failure: access error + retry.
- Non-home data routes may still use access spinner this round.

### Data / behavior

- Do not invent fake node UUIDs in the store; placeholders are presentational only.
- After hydrate: real visible nodes (hidden-node / auth rules unchanged).
- Multi-ping lean path and multi-ping cold pulse remain intact.
- Cache: no new sessionStorage for node count this round (fixed N).

## Requirements

1. Homepage cold path must not use full-main spinner solely waiting for `wsStore.hydrated`.
2. After access clears, first paint shows structural home with light-pulse fixed-N card (and overview) placeholders and reserved geometry.
3. Hydrate → real cards/overview fill without large CLS on first-screen slots; no shimmer/lazy/virtual this round.
4. Private-site and config-error gates remain correct.
5. Update home layout contract tests to match the new shell/grid semantics.

## Acceptance Criteria

- [ ] Visiting `/` cold does **not** show a full-main centered spinner for config pending **or** store hydrate (home path).
- [ ] First paint (JS ready) shows structural homepage with **fixed N** light-pulse card placeholders even before `publicConfig` / theme ready (defaults OK).
- [ ] When node data arrives, placeholders are replaced by real cards without re-showing a full-page spinner.
- [ ] First-screen placeholder geometry is reserved (anti-CLS for the placeholder grid); N→real count may still change height once (accepted with fixed-N choice).
- [ ] No strong shimmer sweep, viewport lazy-load gate, or virtual list introduced.
- [ ] Private-site unauthenticated path ends on lock/login gate (brief placeholder flash before config OK).
- [ ] Public config hard error still shows access error + retry.
- [ ] Multi-ping lean path + multi-ping cold pulse do not regress.
- [ ] `homeLayout.test.ts` (and any related tests) updated to the new contracts; typecheck/lint/targeted tests pass.

## Out of Scope

- Strong e-commerce shimmer sweep
- Viewport lazy load of cards
- Virtual list / infinite scroll
- Remembering last-visit node count across refresh
- Full redesign of Instance / Assets / Traffic loading (shared shell access gate may stay; only home hydrate gate changes)
- Backend API changes
- Zero network wait for real metrics

## Notes

- Complex task: `design.md` + `implement.md` required before `task.py start`.
- Primary anchors: `AppShell.tsx`, `NodeGrid.tsx`, card loading shells, `Home.tsx` (`homeReady` / FloatingControls), `homeLayout.test.ts`.
