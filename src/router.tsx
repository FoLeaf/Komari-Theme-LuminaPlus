import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { RouteErrorFallback } from "@/components/shell/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { loadAssetsPage } from "@/services/assetsPageLoader";
import { Home } from "@/pages/Home";
import { InstancePageSkeleton } from "@/components/instance/InstancePageSkeleton";

const Instance = lazy(() =>
  import("@/pages/Instance").then((m) => ({ default: m.Instance })),
);
const Assets = lazy(() =>
  loadAssetsPage().then((m) => ({ default: m.Assets })),
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFound })),
);
const TrafficPage = lazy(() =>
  import("@/pages/Traffic").then((m) => ({ default: m.Traffic })),
);

function LoadingFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

function suspended(page: ReactNode, fallback?: ReactNode) {
  return (
    <Suspense fallback={fallback ?? <LoadingFallback />}>{page}</Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        index: true,
        // Home is the primary cold-entry surface: eager import so first paint
        // is NodeGrid skeleton, never route-level Spinner while the chunk loads.
        element: <Home />,
      },
      {
        path: "instance/:uuid",
        element: suspended(<Instance />, <InstancePageSkeleton />),
      },
      {
        path: "assets",
        element: suspended(<Assets />),
      },
      {
        path: "traffic",
        element: suspended(<TrafficPage />),
      },
      {
        path: "404",
        element: suspended(<NotFound />),
      },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
