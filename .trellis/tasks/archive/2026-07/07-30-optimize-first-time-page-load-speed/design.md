# optimize-first-time-page-load-speed-software-side

## Technical Design

**Scope**: Focus on client-side and build-time optimizations for initial page load. Target the root layout, Home page, and common routes. Integrate with existing AppShell and NodeGrid patterns from previous tasks.

### Key Optimizations Chosen (based on research and codebase inspection)
1. **Vite Build Config Enhancements** (highest impact):
   - Enable `optimizeDeps` for faster dev/hot reload and production prep.
   - Configure `manualChunks` to split vendor, router, and app-specific code.
   - Set `target: 'esnext'`, minify with esbuild, enable sourcemap false in prod.
   - Add `build.rollupOptions.output.chunkFileNames` for predictable chunk naming.

2. **Code Splitting & Lazy Loading**:
   - Wrap all page components (Home.tsx, ThemeManage.tsx, etc.) with `React.lazy` + `Suspense` in a new layout or AppShell.
   - Use dynamic imports with chunk names for better caching.
   - Preload critical chunks with `<link rel="modulepreload">` in index.html or root layout.

3. **React Optimizations**:
   - Apply `React.memo` to presentational components (NodeGrid, ThemeManageSkeleton).
   - Use `useMemo`/`useCallback` for expensive calculations in hooks (e.g., wsStore, useSiteMetadata).
   - Leverage React 19 features like `useId` for stable keys.

4. **Asset Optimization**:
   - Images: Add `loading="lazy"` + `fetchpriority="high"` for LCP elements; prefer WebP via Vite or modern formats.
   - Fonts: Preload in `<head>`, use `font-display: swap`.
   - CSS: Ensure critical CSS extraction if using Tailwind/JIT; inline above-the-fold styles.

5. **Bundle Analysis & Monitoring**:
   - Integrate `vite-bundle-analyzer` or Rollup visualizer into build script.
   - Add performance budget checks in CI.

### Trade-offs
- Increased initial complexity in lazy loading may slightly increase TTI for first paint if not cached properly, but net win for cold starts.
- Requires updating tests and ensuring hydration gates still work.
- No breaking changes to existing AppShell spinner removal.

### Compatibility
- Works with current React Router 7, TanStack Query, custom wsStore.
- No changes to server rendering if any (pure client).
- Rollback: Revert to previous build config if metrics worsen.

## Data Flow
- Build time: Vite processes imports → generates chunks → lazy components load on demand.
- Runtime: Suspense shows fallback (reuse ThemeManageSkeleton), then hydrate.

## Rollback Points
- If bundle analysis shows no gain, disable manualChunks.
- Preserve original `index.html` and components for easy revert.
