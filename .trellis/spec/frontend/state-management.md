# State Management

> Where state lives and how it flows.

---

## Overview

There is **no Redux/Zustand**. State is split by update frequency and source of truth:

| Kind | Mechanism | Source of truth |
|------|-----------|-----------------|
| Server config / auth / history | TanStack Query | HTTP / RPC |
| Node realtime metrics | `wsStore` singleton | WS/RPC push + polls inside store |
| Homepage ping overview | module store in `usePingOverview.ts` | metric/RPC polls |
| Theme settings (admin) | public config → normalize | Komari `theme_settings` |
| Visitor prefs | localStorage / sessionStorage + external store | browser |
| Ephemeral UI | `useState` in component | component |

---

## 1. Server state (React Query)

`QueryClientProvider` wraps the app in `App.tsx`.

Use for data that is request/response shaped:

- `/api/public`, `/api/me`
- detail `getLoadRecords` / `getPingRecords`
- admin client/ping task lists on Theme Manage
- FX rates for cost summary

Do **not** mirror Query results into another global store without reason.

---

## 2. Realtime node state (`wsStore`)

`src/services/wsStore.ts` owns:

- node meta map
- per-node metrics
- traffic trends
- online summaries
- hydration / error status

React reads via `src/hooks/useNode.ts` only (or carefully through shared hooks). Cards should not import store mutators.

**List vs card split (important for perf):**

- `NodeGrid` uses lightweight summaries + ordered UUID list
- Each card subscribes to its own uuid snapshots
- Re-renders of one node should not rebuild all card models from a full array prop

---

## 3. Homepage ping overview store

Orchestrated by `useHomepagePingOverview(viewMode)` (called from `NodeGrid`).

- Builds assignment from theme multi/single ping settings
- Polls on an interval derived from task intervals
- Commits per-uuid items/lines; notifies only touched keys
- Cards read `useNodePingOverview` / `useNodePingOverviewLines` / `usePingOverviewHydrated`

Keep **one** orchestrator mounted on the home dashboard. Do not start independent pollers per card.

### Homepage lean path (first paint)

Homepage overview defaults are **lean** — not the detail-page full-precision path:

| Concern | Homepage default | Detail page |
|---------|------------------|-------------|
| Metric stats | `includeStats: false` | may call `getPingMetricStats` |
| Boundary repair | `repairBoundary: false` | may repair |
| Latest / max / loss / bars | derived from metric **samples** | full stats path OK |
| Task names | `loadPublicPingTasks()` cache | same |

`getPingOverview` accepts `PingOverviewOptions`; homepage callers must keep lean defaults. Do not reintroduce hard-coded `includeStats: true` / `repairBoundary: true` on the home path.

### Multi-task batch

When multi-ping is active (3 configured tasks), the primary path issues **one** metric query:

- `getPingOverview(hours, undefined, { entityIds, includeStats: false, repairBoundary: false })`
- No per-task `taskId` / tags filter on that batch call
- Client splits mixed-task records into the three configured task maps

Single-task homepage binding still uses lean options (may still group by unique taskId).

### Cache and hydration

- Store is **module memory only**. Hard refresh (F5) is always cold start — no `sessionStorage` for overview.
- `pingOverviewHydrated` must flip true only after a refresh that had **non-empty** `scheduledVisibleUuids`. Marking hydrated on an empty UUID schedule (nodes not ready yet) skips the cold-start pulse when real data arrives.
- Expose hydration via **module-stable** `subscribe` / `getSnapshot` (not an inline subscribe closed over each render). Cards re-render on the 1s metrics tick; unstable subscribe re-subscribes every tick.
- Failure: keep previous values when present; cold empty assigned lines use `null` → UI「无样本」; polling interval continues.

---

## 4. Theme settings

```
public config.theme_settings
  → normalizeThemeSettings (utils/themeSettings.ts)
  → useThemeSettings() adds isReady/isLoading/isError
```

- Raw admin JSON is untrusted shape → always normalize
- `isReady` becomes true on success **or** error so UI can fall back to defaults instead of blanking forever
- Mutations go through admin API (`saveThemeSettings`) on Theme Manage, then rely on config refresh

---

## 5. Visitor preferences

| Preference | Storage | Hook |
|------------|---------|------|
| Appearance | `localStorage` (`appearance`) | `usePreferences` |
| View mode | local + theme defaults | `useViewMode` |
| Home sort override | `sessionStorage` | `useHomeSort` |
| Metric colors | theme_settings + local preview | `useMetricColors` |

Rules observed in code:

- Storage access wrapped in try/catch (private mode)
- Sort override cleared when it matches admin default again
- Appearance persisted as JSON string for older theme compatibility

---

## 6. Component-local state

Appropriate for:

- hover index on bars
- controls expanded flag
- selected group/region tabs on home
- form draft state on Theme Manage

If two distant components need the same ephemeral value, promote to a small module store (as sort/ping did), not Context-by-default. **React Context is essentially unused** for app state today.

---

## Data flow sketch (home card)

```
wsStore (metrics) ─┐
ping overview store ─┼→ useNodeCardModel(uuid) → CompactNodeCard / NodeCard
theme settings ─────┘
```

---

## Anti-patterns

- Prop-drilling full `NodeMetrics` from grid into every child
- Duplicating theme defaults in components instead of `DEFAULT_THEME_SETTINGS`
- Writing to `localStorage` ad hoc without the existing preference helpers
- Using Query for 1Hz realtime metrics (belongs in wsStore)
- Creating a new Context for every control panel
