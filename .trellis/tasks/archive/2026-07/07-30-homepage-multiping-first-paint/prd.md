# Homepage multi-ping first paint

## Goal

Reduce perceived wait for homepage multi-network (三网) latency on first paint: make it actually faster, and ensure cold start does not feel frozen.

## Locked Scope

User-locked scheme for this round only.

### Data layer

- Homepage multi-ping: merge the previous **3 task requests** into **1** metric query; client splits results by task.
- Homepage single-task binding: same **lean** path (no stats, no boundary repair).
- Default homepage path does **not** call `getPingMetricStats` and does **not** run boundary repair.
- Latest value / max / loss / bar chart all derive from metric samples.
- Task names come from `getPublicPingTasks` cache.
- Instance detail page keeps its full-precision path unchanged.
- Failure handling:
  - If previous values exist, keep them.
  - If no previous values, show「无样本」and end loading; background retries on the original interval.
- Cache: memory only. F5 = cold start (no sessionStorage).

### Perception layer

- Only cold start (no in-memory cache) shows a light **pulse** placeholder.
- Fixed three-slot height to prevent CLS.
- No whole-card skeleton, no shimmer sweep, no virtual list (current ~10 nodes do not need it).
- Poll refresh: silent replace of old values, no flash.

### Explicit non-goals (this round)

- Viewport lazy load / virtual list
- sessionStorage across refresh
- Weakening detail-page stats/repair
- E-commerce style large gray skeleton + strong shimmer

## Acceptance Criteria

- [x] Multi-ping homepage issues one metric query for the three configured tasks (not three parallel task queries) on the primary path.
- [x] Homepage multi-ping and single binding do not request `public:getPingMetricStats` by default.
- [x] Homepage multi-ping and single binding do not run boundary repair by default.
- [x] Latest / max / loss / bars are derived from samples on the homepage path.
- [x] Task names resolve from public ping task cache.
- [x] Instance detail ping path remains full-precision (unchanged intent).
- [x] Failed refresh keeps previous values when present; cold empty state shows「无样本」and leaves loading; polling continues.
- [x] Cache is in-memory only; hard refresh is cold start.
- [x] Cold start only: light pulse placeholders in the three multi-ping slots with fixed height (no CLS).
- [x] Poll updates replace values silently without full-card skeleton or shimmer.
- [x] Existing relevant unit tests updated/pass; new coverage for lean multi-task batch path.

## Notes

- Scheme locked by user 2026-07-30; no further brainstorming required unless implementation uncovers a product conflict.
