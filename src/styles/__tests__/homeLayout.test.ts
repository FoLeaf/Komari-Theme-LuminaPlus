import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeCss = readFileSync(new URL("../home.css", import.meta.url), "utf8");
const surfaceCss = readFileSync(new URL("../surface.css", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../../pages/Home.tsx", import.meta.url), "utf8");
const controlsSource = readFileSync(
  new URL("../../components/shell/FloatingControls.tsx", import.meta.url),
  "utf8",
);
const miniSource = readFileSync(
  new URL("../../components/node/MiniNodeCard.tsx", import.meta.url),
  "utf8",
);
const nodeGridSource = readFileSync(
  new URL("../../components/node/NodeGrid.tsx", import.meta.url),
  "utf8",
);
const appShellSource = readFileSync(
  new URL("../../components/shell/AppShell.tsx", import.meta.url),
  "utf8",
);
const routerSource = readFileSync(new URL("../../router.tsx", import.meta.url), "utf8");

describe("home responsive layout contracts", () => {
  it("uses an explicit expanded state through tablet widths without :has()", () => {
    expect(homeCss).not.toContain(":has(");
    expect(homeCss).toMatch(/@media \(max-width: 1023px\)[\s\S]*\.home-dashboard\.is-controls-expanded \.home-brand/);
    expect(homeSource).toContain("onExpandedChange={setControlsExpanded}");
  });

  it("keeps both horizontal edges inside viewport safe areas", () => {
    expect(surfaceCss).toContain("env(safe-area-inset-left, 0px)");
    expect(surfaceCss).toContain("env(safe-area-inset-right, 0px)");
    expect(surfaceCss).toMatch(/padding-left:\s*max\(var\(--app-gutter\)/);
    expect(surfaceCss).toMatch(/padding-right:\s*max\(var\(--app-gutter\)/);
  });

  it("enforces the mini card width floor before adding another fixed column", () => {
    expect(homeCss).toContain("minmax(var(--mini-card-min-width, 260px), 1fr)");
    for (const breakpoint of [1440, 1150, 860, 580]) {
      expect(homeCss).toContain(`@media (max-width: ${breakpoint}px)`);
    }
  });

  it("resets child panels on collapse and keeps home-only routing out of controls", () => {
    expect(controlsSource).toContain("if (nextCollapsed) setColorsOpen(false)");
    expect(controlsSource).not.toContain("useLocation");
    expect(controlsSource).not.toContain("useSearchParams");
    expect(controlsSource).not.toContain("usePublicConfig");
  });

  it("keeps mini cards observer-free and URL-encodes their detail route", () => {
    expect(miniSource).not.toMatch(
      /from\s+["']\.\/(?:MetricBar|LatencyBars|QualityBars|CanvasStrip)["']/,
    );
    expect(miniSource).not.toContain("<canvas");
    expect(miniSource).toContain("encodeURIComponent(node.uuid)");
  });

  it("paints fixed-N light-pulse placeholders instead of zero-value live overview before hydrate", () => {
    expect(nodeGridSource).toContain("hydrated: storeHydrated");
    // 冷分支只看 store hydrate；config 未到也用默认 theme 画骨架，禁止 return null。
    expect(nodeGridSource).toContain("if (!storeHydrated)");
    expect(nodeGridSource.indexOf("if (!storeHydrated)")).toBeLessThan(
      nodeGridSource.indexOf("const homeHeader"),
    );
    expect(nodeGridSource).not.toContain("if (!themeSettings.isReady) return null");
    // 冷分支：结构首页 + pulse 占位，禁止 Spinner / 禁止把 0 值真概览塞进 hydrate 前路径。
    expect(nodeGridSource).toContain("HOME_PLACEHOLDER_COUNT");
    expect(nodeGridSource).toContain("data-home-placeholders");
    expect(nodeGridSource).toContain("data-home-overview-placeholder");
    expect(nodeGridSource).toContain("HomeOverviewPlaceholder");
    expect(nodeGridSource).toContain("HomePlaceholderGrid");
    expect(nodeGridSource).toMatch(/large:\s*6/);
    expect(nodeGridSource).toMatch(/compact:\s*6/);
    expect(nodeGridSource).toMatch(/mini:\s*8/);
    expect(nodeGridSource).toMatch(/list:\s*8/);
    // 占位几何对齐各档 shell / contain-intrinsic-size，避免空 flex 塌成一条线。
    expect(nodeGridSource).toContain("minHeight: 438");
    expect(nodeGridSource).toContain("minHeight: 284");
    expect(nodeGridSource).toContain("minHeight: 228");
    expect(nodeGridSource).not.toMatch(/shimmer/i);
    expect(nodeGridSource).not.toContain("IntersectionObserver");
    expect(nodeGridSource).not.toMatch(/virtual(?:ized|List|Scroller)/i);
    const loadingBranch = nodeGridSource.slice(
      nodeGridSource.indexOf("if (!storeHydrated)"),
      nodeGridSource.indexOf("const homeHeader"),
    );
    expect(loadingBranch).toContain("<HomeBrand");
    expect(loadingBranch).toContain("HomeOverviewPlaceholder");
    expect(loadingBranch).toContain("HomePlaceholderGrid");
    expect(loadingBranch).not.toContain("<Spinner");
    expect(loadingBranch).not.toContain("<HomeOverviewCards");
    expect(loadingBranch).not.toContain("return null");
    // FloatingControls 仍等 ready+hydrated，冷启动不开放主题控件。
    expect(homeSource).toContain("const homeReady = themeSettings.isReady && storeHydrated");
    expect(homeSource).toContain("{homeReady && <FloatingControls");
  });

  it("never full-page spins home, theme-manage, or instance while still gating other data routes", () => {
    expect(appShellSource).toContain("useNodeStoreStatus(canHydrateNodes)");
    expect(appShellSource).not.toContain("isCheckingHomeData");
    // 首页 + 主题设置 + 节点详情不因 publicConfig pending 挡 Outlet；Assets/Traffic 仍可 access spinner。
    expect(appShellSource).toContain("skipAccessSpinner");
    expect(appShellSource).toContain("isHomeDashboard || isThemeManageView || isInstanceRoute");
    expect(appShellSource).toContain("!skipAccessSpinner && isCheckingAccess");
    expect(appShellSource).toMatch(/canHydrateNodes[\s\S]*!isPrivateSite \|\| loggedIn/);
    expect(appShellSource).toContain('normalizedPath === "/assets"');
    expect(appShellSource).toContain('normalizedPath === "/traffic"');
    expect(appShellSource).toContain("OfflineBanner");
    expect(appShellSource).toContain("route-transition");
    // Home is eager — no route-level Spinner while Home chunk loads on cold cache.
    expect(routerSource).toContain('import { Home } from "@/pages/Home"');
    expect(routerSource).not.toMatch(/const Home(?:Page)?\s*=\s*lazy/);
    expect(routerSource).toContain("element: <Home />");
    expect(routerSource).toContain("InstancePageSkeleton");
  });

  it("wires PWA offline shell contracts", () => {
    const viteConfig = readFileSync(new URL("../../../vite.config.ts", import.meta.url), "utf8");
    const indexHtml = readFileSync(new URL("../../../index.html", import.meta.url), "utf8");
    const offlineDb = readFileSync(
      new URL("../../services/offlineDb.ts", import.meta.url),
      "utf8",
    );
    expect(viteConfig).toContain("vite-plugin-pwa");
    expect(viteConfig).toContain("VitePWA");
    expect(viteConfig).toContain('handler: "NetworkOnly"');
    expect(viteConfig).toContain("navigateFallbackDenylist");
    expect(viteConfig).toContain("/^\\/admin(?:\\/|$)/");
    expect(viteConfig).toContain('registerType: "autoUpdate"');
    expect(viteConfig).toContain("/icons/pwa-192x192.png");
    expect(viteConfig).toContain("/icons/pwa-512x512-maskable.png");
    expect(viteConfig).toContain('purpose: "maskable"');
    expect(viteConfig).toContain("favicon.ico");
    expect(indexHtml).toContain('href="/favicon.ico"');
    expect(indexHtml).toContain("/icons/apple-touch-icon.png");
    expect(indexHtml).toContain("/icons/pwa-192x192.png");
    // Manifest install icons must be PNG paths, not src favicon.ico (ICO mis-parse → solid blob).
    expect(viteConfig).not.toMatch(/src:\s*["'][^"']*favicon\.ico["']/);
    expect(offlineDb).toContain("komari-theme-offline");
    expect(surfaceCss).toContain("prefers-reduced-motion");
    expect(surfaceCss).toContain(".route-transition");
    expect(surfaceCss).toContain(".offline-banner");
  });

  it("uses ThemeManageSkeleton instead of full-page spinners on theme-manage entry", () => {
    expect(homeSource).toContain("ThemeManageSkeleton");
    expect(homeSource).toContain('from "@/pages/ThemeManageSkeleton"');
    expect(homeSource).toContain("fallback={<ThemeManageSkeleton />}");
    expect(homeSource).not.toContain("<Spinner");
    const skeletonSource = readFileSync(
      new URL("../../pages/ThemeManageSkeleton.tsx", import.meta.url),
      "utf8",
    );
    const themeManageSource = readFileSync(
      new URL("../../pages/ThemeManage.tsx", import.meta.url),
      "utf8",
    );
    expect(skeletonSource).toMatch(/ThemeManageSkeleton/);
    expect(skeletonSource).toContain("data-theme-manage-skeleton");
    expect(skeletonSource).toContain("export { ThemeManageSkeleton }");
    expect(themeManageSource).toContain('from "@/pages/ThemeManageSkeleton"');
    expect(themeManageSource).toMatch(
      /if \(configLoading\) \{\s*return <ThemeManageSkeleton \/>;/,
    );
  });

  it("uses contrast-safe skeleton bones (not white-on-white in light mode)", () => {
    const tokensCss = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
    const chartSkeletonSource = readFileSync(
      new URL("../../components/instance/ChartSkeletonBody.tsx", import.meta.url),
      "utf8",
    );
    expect(tokensCss).toContain("--skeleton-bone");
    expect(surfaceCss).toContain(".skeleton-bone");
    expect(surfaceCss).toMatch(
      /\.instance-chart-skeleton-plot[\s\S]*background:\s*var\(--skeleton-bone\)/,
    );
    expect(chartSkeletonSource).toContain("skeleton-bone");
    expect(chartSkeletonSource).not.toContain("bg-[var(--surface-elev)]");
  });

  it("uses instance page and chart skeletons instead of Spinner waits", () => {
    const instanceSource = readFileSync(
      new URL("../../pages/Instance.tsx", import.meta.url),
      "utf8",
    );
    const instancePanelSource = readFileSync(
      new URL("../../components/instance/InstancePanel.tsx", import.meta.url),
      "utf8",
    );
    const instanceSkeletonSource = readFileSync(
      new URL("../../components/instance/InstancePageSkeleton.tsx", import.meta.url),
      "utf8",
    );
    const chartSkeletonSource = readFileSync(
      new URL("../../components/instance/ChartSkeletonBody.tsx", import.meta.url),
      "utf8",
    );
    expect(instanceSource).toContain("InstancePageSkeleton");
    expect(instanceSource).not.toContain("<Spinner");
    expect(instanceSource).not.toContain('from "@/components/ui/Spinner"');
    expect(instancePanelSource).toContain("InstanceChartLoading");
    expect(instancePanelSource).toContain("ChartSkeletonBody");
    expect(instancePanelSource).not.toContain("<Spinner");
    expect(instancePanelSource).not.toContain('from "@/components/ui/Spinner"');
    expect(instanceSkeletonSource).toContain("data-instance-page-skeleton");
    expect(instanceSkeletonSource).not.toContain("<Spinner");
    expect(chartSkeletonSource).toContain("data-instance-chart-skeleton");
    expect(routerSource).toContain("suspended(<Instance />, <InstancePageSkeleton />)");
  });
});
