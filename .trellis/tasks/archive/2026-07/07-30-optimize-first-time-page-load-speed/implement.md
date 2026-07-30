# optimize-first-time-page-load-speed-software-side

## Execution Plan

**Priority Order**: Vite config first (biggest win), then lazy loading, then React/asset tweaks.

### Step-by-Step Implementation

1. **Update Vite Configuration** (vite.config.ts or equivalent in root)
   - Add/enhance `optimizeDeps` and `build.rollupOptions`.
   - Run `npm run build` and analyze with `npx vite-bundle-analyzer` to validate.

2. **Implement Lazy Loading in AppShell / Root Layout**
   - Wrap Routes with Suspense.
   - Lazy load Home.tsx, ThemeManage.tsx, and other pages.
   - Reuse existing ThemeManageSkeleton for fallbacks.

3. **Add Preloads and Meta Tags**
   - Update index.html with modulepreload for critical JS/CSS.
   - Add fetchpriority to key images.

4. **Optimize Components**
   - Add React.memo to NodeGrid.tsx, ThemeManageSkeleton.tsx.
   - Audit hooks for useMemo/useCallback.

5. **Image & Font Optimizations**
   - Add lazy attributes to images in Home.tsx etc.
   - Preload fonts in layout.

6. **Validation**
   - Run lint, type-check, tests.
   - Measure FCP/TTI in dev tools (cold start in incognito).
   - Update spec if new patterns discovered.

**Risks & Mitigations**:
- Lazy loading hydration mismatch: Ensure AppShell gate handles Suspense properly (reuse previous no-spinner fixes).
- Bundle bloat: Monitor chunk sizes.
- Rollback: Git revert specific files.

**Commands to Run**:
- `npm run build -- --mode production`
- `npx vite-bundle-analyzer dist/assets`
- `npm run test`

## Ordered Checklist

- [ ] Update vite.config.ts with optimizations
- [ ] Wrap pages in lazy + Suspense
- [ ] Add preloads
- [ ] Optimize components
- [ ] Validate with bundle analyzer and Lighthouse
- [ ] Update .trellis/spec if new knowledge gained
- [ ] Commit changes

## Validation Commands

```bash
npm run build
npx vite-bundle-analyzer
npm run lint
npm run type-check
npm test -- --passWithNoTests
```

After implementation, run full quality check before proceeding to commit.
