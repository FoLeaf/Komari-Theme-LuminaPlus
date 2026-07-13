import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { RouteErrorFallback } from "@/components/shell/ErrorBoundary";
import { Spinner } from "@/components/ui/Spinner";
import { loadAssetsPage } from "@/services/assetsPageLoader";

const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Instance = lazy(() =>
  import("@/pages/Instance").then((m) => ({ default: m.Instance })),
);
const Assets = lazy(() =>
  loadAssetsPage().then((m) => ({ default: m.Assets })),
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFound })),
);

function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner />
    </div>
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
        element: (
          <Suspense fallback={<Loading />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "instance/:uuid",
        element: (
          <Suspense fallback={<Loading />}>
            <Instance />
          </Suspense>
        ),
      },
      {
        path: "assets",
        element: (
          <Suspense fallback={<Loading />}>
            <Assets />
          </Suspense>
        ),
      },
      {
        path: "404",
        element: (
          <Suspense fallback={<Loading />}>
            <NotFound />
          </Suspense>
        ),
      },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
