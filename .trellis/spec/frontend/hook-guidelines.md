# Hook Guidelines

> Custom hooks and React data-binding patterns in this theme.

---

## Overview

Hooks are the React face of three backends:

1. **TanStack Query** — infrequent HTTP/config (`usePublicConfig`, `useAuth`, admin lists)
2. **wsStore external store** — high-frequency node realtime (`useNode*`)
3. **Module singletons + useSyncExternalStore** — preferences, ping overview, sort, appearance

Keep hooks thin. Put pure logic in `utils/`; put network in `services/`.

---

## Naming

| Pattern | Meaning | Example |
|---------|---------|---------|
| `useX` | Public hook | `useThemeSettings` |
| `useEnsured` / internal helpers | File-private | in `useNode.ts` |
| `useXSnapshot` | Internal store snapshot binder | `useNodeMetaSnapshot` |

Files: one primary concern per file under `src/hooks/`. Related pure exports may live in the same file when tightly coupled (e.g. `buildPingBuckets` next to `usePingBuckets` in `usePingOverview.ts`).

---

## Pattern A — TanStack Query wrappers

```ts
// src/hooks/useAuth.ts, usePublicConfig.ts, useRecords.ts
useQuery({
  queryKey: [...],
  queryFn: ({ signal }) => getSomething({ signal }),
  staleTime: ...,
})
```

Global defaults live in `src/services/queryClient.ts`:

- `staleTime: 30_000`
- `refetchOnWindowFocus: false`
- retry once, skip most 4xx (`ApiRequestError`)

Use Query for: public config, me/auth, load/ping history on detail pages, cost FX rates, admin theme-manage lists.

---

## Pattern B — wsStore via useSyncExternalStore

```ts
// src/hooks/useNode.ts
useEnsured(); // retainStore() while mounted
return useSyncExternalStore(subscribeToNodeMeta(uuid), getSnapshot, getSnapshot);
```

Rules:

- Always call `retainStore()` through `useEnsured` when reading live node data
- Prefer **per-uuid subscriptions** over dumping the full map into every card
- `useNodeCardSnapshots(uuid)` batches meta + metrics + traffic trend for cards
- List parents should subscribe to **summaries/uuids**, not full metrics (`useHomeNodeSummaries`, `useVisibleNodeUuids`)

---

## Pattern C — Feature external stores

Used when multiple components must share imperative module state:

| Hook | Store purpose |
|------|----------------|
| `usePreferences` / appearance | localStorage appearance + DOM class |
| `useHomepagePingOverview` | schedule/poll homepage ping; cards use `useNodePingOverview*` |
| `usePingOverviewHydrated` | cold-start flag for multi-ping pulse (module store) |
| `useHomeSort` | session override of admin default sort |
| `useMetricColors` | CSS vars + canvas redraw version |
| `useViewMode` | desktop/mobile card density |

Common shape:

- module-level `listeners: Set`
- **module-stable** `subscribe` / `getSnapshot` function references
- `useSyncExternalStore(subscribe, getSnapshot, getSnapshot)` (same snapshot for SSR-less client)

> **Gotcha**: Do not pass an inline `subscribe` created inside the hook body when many cards mount the same store. Homepage cards re-render ~1Hz via metrics; a new subscribe identity re-subscribes every tick. Export named module-level subscribe/snapshot helpers (see `subscribeToPingHydrated` in `usePingOverview.ts`).

---

## Pattern D — View models

`useNodeCardModel` composes store + ping + theme flags into one object for card JSX. Prefer this over 8 hooks in the component body when the bundle is stable for a card type.

For multi-ping first paint, the model exposes `homepagePingColdStart` (`multiPingActive && !pingHydrated`) so large/compact cards can pass a single boolean into `MultiPingStatus` without each card owning pulse logic.

---

## Enabled flags

Many hooks accept `enabled` to skip subscribe/work:

```ts
useNodeMetrics(uuid, enabled)
useNodePingOverview(uuid, !multiPingActive)
usePingBuckets(ping, count, enabled)
```

Use this when a view mode makes a data path irrelevant (multi vs single ping).

---

## Effects discipline

- Ping polling: consumer refcount (`activeConsumers`) start/stop in `useHomepagePingOverview`
- Prefetch: idle/timeout warm paths in `NodeGrid` (`preloadAssetsPage`, traffic stats)
- Abort: pass `signal` from Query or `AbortController` into `services/api`

---

## Testing hooks

- Prefer testing **pure exports** from hook modules (`resolveHomepagePingRequestMode`, `buildPingBuckets`, `getNextViewMode`) under `hooks/__tests__/`
- Full hook render tests are rare; store/util unit tests cover most regressions

---

## Anti-patterns

- `useState` + `useEffect` fetch when Query or wsStore already covers it
- Subscribing every card to the full nodes map
- Starting ping polling from each card instead of one homepage orchestrator
- Putting Zod / RPC details inside hooks (keep in `services/api.ts`)
- Forgetting `enabled` and double-fetching multi + single ping for the same card
- Homepage multi-ping fanning out **3** `getPingOverview(…, taskId)` calls instead of one taskId-less batch
- Flipping `pingOverviewHydrated` true when `scheduledVisibleUuids` is still empty
- Inline `subscribe` for shared hydration/store flags used by many memo cards
