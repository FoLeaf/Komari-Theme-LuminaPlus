# Design: Homepage multi-ping first paint

## Current state

- `buildPingOverviewMap` fans out one `getPingOverview(hours, taskId, { entityIds })` per selected task.
- Multi-ping therefore fires 3 parallel homepage overview calls.
- `getPingOverview` currently hardcodes `includeStats: true` and `repairBoundary: true` even though `getPingMetricData` already supports lean flags.
- Partial WIP in `src/services/api.ts`: `PingOverviewOptions` exists but is not wired into `getPingOverview`.
- UI: `MultiPingStatus` always renders three lines once multi-ping is active; cold empty state shows null values / placeholder task names with no loading pulse.
- Store is module memory only; F5 already cold-starts.

## Target architecture

### API / data

1. **Lean homepage overview**
   - Wire `getPingOverview` options to `PingOverviewOptions`.
   - Defaults for homepage: `includeStats: false`, `repairBoundary: false`.
   - Derive last/max/loss from samples in `buildPingOverviewItems` (already does when stats empty).
   - Keep loading task names via cached `loadPublicPingTasks()` inside metric path.

2. **Multi-task batch query**
   - Add/extend overview fetch so multi-ping can request **without per-task tags**, once for all visible `entityIds`, returning mixed-task records.
   - Preferred shape: one `getPingOverview(hours, undefined, { entityIds, includeStats: false, repairBoundary: false })` (or explicit multi-task helper) when multi mode is active.
   - Client filters records to the three configured task IDs and builds per-task maps as today.
   - Single-task mode: keep per unique taskId requests if needed, but always lean flags.

3. **Detail path unchanged**
   - Instance detail continues using `getPingRecords` / `getPingMetricStats` as today.
   - Do not weaken detail stats or repair in this task.

4. **Failure semantics**
   - Keep existing previous-value retention in `buildPingOverviewMap` when a request fails.
   - For full batch failure with no previous: assigned empty items (`lastValue/loss = null` → UI「无样本」).
   - Polling interval continues regardless.

### Perception / UI

1. Expose homepage ping load status from the overview store (at least: never successfully loaded vs has data epoch).
2. `MultiPingStatus` / card model:
   - Cold start + multi-ping active → fixed-height three-slot pulse placeholders.
   - After first successful commit (even if samples empty) → normal values /「无样本」, no pulse.
   - Subsequent polls: silent value replace; no re-entry into pulse.
3. CSS: reserve multi-ping block height for 3 rows × 2 columns; pulse is light opacity animation only (no shimmer sweep, no whole-card skeleton change for this section).

## Tradeoffs

- Skipping stats/repair slightly lowers absolute accuracy on homepage previews; accepted for first paint. Detail page retains precision.
- Unfiltered multi-task metric query may return extra tasks for entities; client filters to configured IDs. Payload is still smaller than 3× full overview + stats + repair.
- Fallback legacy `common:getRecords` / REST may still need per-task when metric API is unavailable; batch merge is best-effort on metric primary path.

## Compatibility / rollback

- Feature is client-only. Revert API/hook/UI commits to restore prior 3-request heavy path.
- Theme settings / admin multi-ping config unchanged.
*** End of File ***
