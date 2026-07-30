# Design: Homepage first paint without spinner

## Problem

Cold visit to `/` waits on `AppShell.isCheckingShell`, which ORs:

1. Access checks (`publicConfig` / private auth)
2. **Home node store hydrate** (`!hydrated`)

While (2) is true, the shell renders a full-main `Spinner` and **does not mount** `<Outlet />`. Users perceive an explicit empty spin before any card chrome appears—even though background layer is already up and per-card pulse shells already exist deeper in the tree.

## Target behavior

```
URL /
  → BackgroundLayer paints
  → publicConfig (+ private auth if needed)    [access gate may still spinner briefly]
  → access OK
  → mount Home / NodeGrid immediately
  → fixed-N light-pulse card (+ overview) placeholders
  → wsStore hydrates (retainStore already started via canHydrateHome)
  → replace placeholders with real visible nodes
  → multi-ping cold pulse continues on its own lean path
```

## Architecture

### 1. Split shell gates (`AppShell.tsx`)

| Gate | When | UI |
|------|------|-----|
| Access pending | `publicConfig.isPending` or private+auth pending | Keep brief full-main spinner (or equivalent non-card gate) — **locked** |
| Access error | config hard fail | AccessError + retry |
| Private visitor | private + not logged in | PrivateSiteGate |
| Home data pending | was `isCheckingHomeData` | **Remove from shell spinner**; allow Outlet |

Keep `useNodeStoreStatus(canHydrateHome)` so home still **starts** hydrate as soon as access allows—do not delay `retainStore`.

`isCheckingShell` becomes access-only (rename optional for clarity, e.g. `isCheckingAccessOnly`).

Non-home data routes (`/assets`, `/traffic`, `/instance/*`) today piggyback only on access checks for the spinner (home hydrate flag is home-dashboard-only). Confirm no regression: they should not start depending on home placeholders.

### 2. Structural cold home (`NodeGrid.tsx` + thin presentational helpers)

When `themeSettings.isReady && !storeHydrated && !nodeInfoError`:

- Render **home chrome**: brand (from `publicConfig` sitename if present), optional overview **pulse** block if `showHomeOverview`, controls bar can stay deferred (today FloatingControls waits `homeReady` in `Home.tsx` — keep deferred until hydrated/ready to avoid interactive controls on empty data).
- Render **fixed N** presentational placeholder cards matching current `viewMode` grid classes / min column widths from `GRID_LAYOUT`.
- Do **not** push fake UUIDs into `wsStore`.

When `nodeInfoError` and not hydrated: keep / improve the existing error waiting copy (no fake success cards).

When hydrated and `visibleNodes.length === 0`: existing empty-state copy (not placeholders).

When hydrated with nodes: existing real card map.

Suggested constants (pin in implement):

| View mode | Placeholder count N | Geometry |
|-----------|---------------------|----------|
| large | 6 | reuse `server-card` minHeight ~438 pulse shell |
| compact | 6 | reuse `compact-node-card` pulse shell |
| mini | 8 | reuse `mini-node-card` pulse shell |
| list | 8 | reuse `node-list-row is-loading` |

Exact N is product-flexible within “fixed N”; 6/8 above is the design default.

### 3. Reuse existing card loading shells

Prefer extracting a shared presentational component or mapping mode → existing class shells:

- `NodeCard` empty: `server-card animate-pulse` + minHeight
- `CompactNodeCard` empty: `compact-node-card animate-pulse`
- `MiniNodeCard` empty: `mini-node-card animate-pulse`
- list: `node-list-row is-loading`

Light pulse only (`animate-pulse` / existing multi-ping-style opacity pulse). **No** new shimmer keyframes this round.

Optional: slightly stronger shared class `home-card-placeholder` for min-height tokens in CSS if inline minHeights drift—only if needed.

### 4. Overview placeholders

If overview is enabled (`showHomeOverview` once theme ready):

- While `!storeHydrated`, render overview container with fixed min-height and light pulse blocks for rating/traffic slots **or** skip zero-value real overview (current test forbids zero-value overview before hydrate—preserve that intent by using explicit placeholders, not `overview` zeros).

### 5. `Home.tsx` FloatingControls

Keep `homeReady = themeSettings.isReady && storeHydrated` for FloatingControls mount. Placeholders do not need theme controls open on cold paint.

### 6. Tests

Update `src/styles/__tests__/homeLayout.test.ts`:

- Stop requiring `isCheckingAccess || isCheckingHomeData` as the spinner condition.
- Assert shell still owns access spinner / hydrate retain via `useNodeStoreStatus(canHydrateHome)`.
- Assert NodeGrid cold branch renders structural placeholders (source contract: placeholder marker / fixed N / no Spinner) **before** real `homeHeader` zero-overview path, or adjust assertions to match new structure.
- Keep: no zero-value live overview cards before hydrate (placeholders ≠ live overview numbers).

Add or extend a small pure/source test if placeholder N is exported constant.

## Data flow

```
AppShell
  access OK → Outlet → Home → NodeGrid
                              ├─ useHomepagePingOverview(mode)  (may no-op until ready/uuids)
                              ├─ !hydrated → PlaceholderGrid(N)
                              └─ hydrated → real cards by uuid

wsStore.retainStore (via useNodeStoreStatus(canHydrateHome) in AppShell)
  → first syncNodeInfo → hydrated true → NodeGrid re-render
```

## Tradeoffs

| Choice | Benefit | Cost |
|--------|---------|------|
| Fixed N placeholders | Simple, F5-stable, no storage | One height jump when real count ≠ N |
| Keep config spinner | Correct private gate, no fake cards for private visitors | Short spin still possible on slow config |
| No virtual list / lazy | Matches ~10-node installs, low risk | Large installs still mount all cards after hydrate (pre-existing) |
| Presentational only | No store pollution | Cannot reuse card model hooks until real uuids |

## Compatibility / rollback

- Client-only. Revert `AppShell` + `NodeGrid` (+ tests/CSS) to restore spinner gate.
- Does not change Komari APIs or theme_settings schema.

## Non-goals (reconfirm)

- Shimmer sweep, IntersectionObserver card fetch, virtual list, session count cache.
- Speeding config/auth beyond existing Query behavior (optional future).
