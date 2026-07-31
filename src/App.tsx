import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/components/shell/ErrorBoundary";
import { queryClient } from "@/services/queryClient";
import {
  attachQueryPersistence,
  hydrateQueryClient,
} from "@/services/queryPersist";
import { router } from "@/router";

export function App() {
  useEffect(() => {
    let active = true;
    const detach = attachQueryPersistence(queryClient);
    void hydrateQueryClient(queryClient).then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
      detach();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
