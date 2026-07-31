import { Outlet, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { BackgroundLayer } from "./BackgroundLayer";
import { OfflineBanner } from "./OfflineBanner";
import { Spinner } from "@/components/ui/Spinner";
import { useAppearance } from "@/hooks/useAppearance";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { useSiteMetadata } from "@/hooks/useSiteMetadata";
import { useMetricColorsSync } from "@/hooks/useMetricColors";
import { useNodeStoreStatus } from "@/hooks/useNode";

export function AppShell() {
  useAppearance();
  useSiteMetadata();
  useMetricColorsSync();
  const { pathname, search } = useLocation();
  const online = useOnlineStatus();
  const publicConfig = usePublicConfig();
  const auth = useAuth();
  const normalizedPath = (pathname.replace(/\/+$/, "") || "/").toLowerCase();
  const isDataRoute =
    normalizedPath === "/" ||
    normalizedPath === "/assets" ||
    normalizedPath === "/traffic" ||
    normalizedPath.startsWith("/instance/");
  const view = new URLSearchParams(search).get("view");
  const isThemeManageView = normalizedPath === "/" && view === "theme-manage";
  const isHomeDashboard = normalizedPath === "/" && !isThemeManageView;
  const isInstanceRoute = normalizedPath.startsWith("/instance/");
  // 首页 / 主题设置 / 节点详情：等待期画骨架，不全屏 Spinner。
  const skipAccessSpinner =
    isHomeDashboard || isThemeManageView || isInstanceRoute;

  const accessError = isDataRoute && publicConfig.isError && !publicConfig.data;
  const isPrivateSite = publicConfig.data?.private_site === true;
  const authPending = auth.isPending;
  const loggedIn = auth.data?.logged_in === true;
  // 已确认私有且未登录：锁站。auth 未决时不落锁，骨架页先画。
  const isPrivateVisitor =
    isDataRoute && isPrivateSite && !authPending && !loggedIn;

  const isCheckingAccess =
    isDataRoute &&
    (publicConfig.isPending || (isPrivateSite && authPending));

  // Assets / Traffic 等仍用 access spinner；home / theme-manage / instance 跳过。
  const blockWithSpinner = isDataRoute && !skipAccessSpinner && isCheckingAccess;

  // config 未到时乐观开 hydrate（公开站主路径）。
  // 私有站仅登录后拉节点，避免未授权请求。
  // Assets/Traffic 也 hydrate，便于离线读节点列表与横幅状态。
  const canHydrateNodes =
    (isHomeDashboard ||
      isInstanceRoute ||
      normalizedPath === "/assets" ||
      normalizedPath === "/traffic") &&
    !accessError &&
    (!isPrivateSite || loggedIn);

  const storeStatus = useNodeStoreStatus(canHydrateNodes);

  const showOutlet = !accessError && !isPrivateVisitor && !blockWithSpinner;
  // pathname only：避免 search 变化（theme-manage）触发整页过渡。
  const routeKey = normalizedPath;

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundLayer />
      <main className="app-main flex-1 px-3 pb-8 sm:px-5 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1720px]">
          {blockWithSpinner ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <Spinner size={24} />
            </div>
          ) : accessError ? (
            <AccessError
              online={online}
              hasCachedPublic={Boolean(publicConfig.data)}
              onRetry={() => void publicConfig.refetch()}
            />
          ) : isPrivateVisitor ? (
            <PrivateSiteGate />
          ) : showOutlet ? (
            <>
              <OfflineBanner
                online={online}
                dataSource={storeStatus.dataSource}
                cacheSavedAt={storeStatus.cacheSavedAt}
                failureStreak={storeStatus.failureStreak}
              />
              <div key={routeKey} className="route-transition">
                <Outlet />
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function AccessError({
  onRetry,
  online,
  hasCachedPublic,
}: {
  onRetry: () => void;
  online: boolean;
  hasCachedPublic: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">
          {online ? "无法读取站点配置" : "当前离线且无可用配置缓存"}
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          {hasCachedPublic
            ? "请检查网络后重试。"
            : online
              ? "请检查网络后重试。"
              : "联网成功后将自动恢复。"}
        </p>
      </div>
      <button type="button" onClick={onRetry} className="control-button px-4 py-2 text-[13px] font-medium">
        重试
      </button>
    </div>
  );
}

function PrivateSiteGate() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-elev)] text-[var(--text-tertiary)]">
        <Lock size={22} strokeWidth={2} />
      </div>
      <div className="space-y-2">
        <div className="text-[15px] font-semibold text-[var(--text-primary)]">站点已设为私有</div>
        <p className="max-w-[32rem] text-[13px] text-[var(--text-secondary)]">
          登录后即可查看节点数据。
        </p>
      </div>
      <a
        href="/admin"
        target="_blank"
        rel="noopener noreferrer"
        className="control-button px-4 py-2 text-[13px] font-medium"
      >
        前往登录
      </a>
    </div>
  );
}
