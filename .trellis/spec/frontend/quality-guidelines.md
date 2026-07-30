# Quality Guidelines

> Lint, test, performance, a11y, and review expectations as practiced in this repo.

---

## Tooling

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint flat config (`eslint.config.js`) |
| `npm run typecheck` / `tsc -b` | TypeScript project build |
| `npm test` | Vitest unit tests |
| `npm run build` | production build |
| `npm run package` | build + preview image + theme zip |

ESLint is intentionally narrow: `react-hooks/rules-of-hooks` error, `exhaustive-deps` warn. Style is enforced more by TypeScript + review than a huge rule set.

Ignores: `dist`, `node_modules`, `scripts`, `public`, vendored source dirs.

---

## Testing conventions

- Runner: **Vitest**
- Files: `src/**/__tests__/*.test.ts` (and some co-located)
- Style: `describe` / `it` / `expect`, mostly **pure function** tests
- Heavy coverage areas: `utils/*`, ping overview builders, theme normalize, api metric adapters

Good test examples:

- `src/utils/__tests__/pingTasks.test.ts` — normalization edge cases
- `src/hooks/__tests__/usePingOverview.test.ts` — bucket projection, multi-batch (=1 request), lean options, failure retention
- `src/services/__tests__/api.test.ts` — lean homepage defaults + metric boundary repair / fallbacks

When changing homepage ping or metric adapters, extend these tests rather than only manual UI checks. Assert multi-mode call count (1) and `includeStats` / `repairBoundary` lean flags.

Component RTL tests are not the default; prefer extracting pure logic.

---

## Performance rules (homepage-critical)

These are load-bearing in production (many cards, 1s metrics ticks):

1. **Memo cards** (`NodeCard`, `CompactNodeCard`, `MiniNodeCard`, `MultiPingStatus`)
2. **UUID list stability** — grid maps uuids; cards pull their own data
3. **Ping poll once** via `useHomepagePingOverview`, not per card
4. **Multi-ping = one metric batch** (no taskId tags) + client split; single binding stays lean
5. **Equal checks before notifying** ping listeners (`equalPingItem` / `equalPingLine`)
6. **Canvas bars** instead of large DOM bar counts
7. **Lazy routes** for Instance/Assets
8. **AbortSignal + timeouts** on API/RPC (`fetchWithTimeout`, overview timeout ~35s)
9. Avoid work for hidden nodes (theme `hiddenNodes` filtered from overview)
10. **Cold pulse once** — hydrate only after non-empty visible UUIDs; stable hydrate subscribe
11. **Home first paint** — `AppShell` spinner is access-only; `NodeGrid` shows fixed-N light-pulse placeholders until hydrate (no full-page spin on store alone)

If you add homepage data fetching, measure cost under multi-ping. Target: **1** overview query for three tasks, **0** stats, **0** boundary repair on the primary home path.

---

## Error handling

- Route errors: `errorElement: <RouteErrorFallback />`
- Tree errors: `ErrorBoundary` in `App`
- Diagnostics omit secrets (only path + optional `view=` query)
- Query: limited retry; surface message in Theme Manage / auth gates
- Ping overview: multi-batch or per-task `Promise.allSettled` style resilience; keep previous line on partial failure; cold empty →「无样本」, keep polling

Never leave infinite spinners without a ready/error escape (`useThemeSettings.isReady` pattern). Prefer structural placeholders over a full-main spinner once access is allowed on home.

---

## Accessibility & UI copy

- Icon-only controls need `aria-label` / `title`
- Chinese UI copy is normal for end-user strings; code identifiers stay English
- Comments are often Chinese and explain **why** (perf, compatibility) — keep that style for non-obvious logic
- Do not ship user-facing walls of feature instructions on the home dashboard

---

## CSS / visual quality

- Tokens in `styles/tokens.css`; do not hardcode one-off hex in many components when a token exists
- Respect `surface-alpha` / glass settings
- Tabular numbers for metrics
- Preserve CLS: fixed three-slot multi-ping height; cold-start uses light pulse only (`.is-cold-start`), not whole-card skeleton

---

## Comments

Write comments when:

- Compatibility with older Komari APIs
- Perf invariants (why memo / why skip notify)
- Subtle product rules (sort offline sink, traffic limit types)

Skip narrating obvious assignments.

---

## PR / change checklist (practical)

- [ ] `npm run typecheck`
- [ ] `npm test` (or targeted vitest for touched domain)
- [ ] `npm run lint` if hooks/components changed
- [ ] Homepage multi-ping path considered if touching `api.ts` / `usePingOverview` (1 batch, lean flags, cold hydrate rules)
- [ ] Homepage shell/grid cold path considered if touching `AppShell` / `NodeGrid` (access-only spinner, fixed-N placeholders, `homeLayout.test.ts`)
- [ ] No secret/token logging
- [ ] Theme settings still normalize safely when fields missing

---

## Anti-patterns

- Adding dependencies for problems solved by existing utils/store
- Snapshot tests of huge DOM trees
- Disabling hooks lint without fixing deps
- Fetching in `useEffect` without abort
- Breaking memo by passing fresh inline objects/functions into memo children every parent tick
- Expanding ESLint to hundreds of stylistic rules without team agreement
