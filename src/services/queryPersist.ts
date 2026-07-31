import type { Query, QueryClient } from "@tanstack/react-query";
import {
  loadAllQueryRecords,
  saveQueryRecord,
  shouldPersistQueryKey,
} from "@/services/offlineDb";

function isSuccessfulQuery(query: Query): boolean {
  return query.state.status === "success" && query.state.data !== undefined;
}

export async function hydrateQueryClient(queryClient: QueryClient): Promise<void> {
  const records = await loadAllQueryRecords();
  for (const record of records) {
    if (!shouldPersistQueryKey(record.queryKey)) continue;
    queryClient.setQueryData(record.queryKey, record.data);
  }
}

export function attachQueryPersistence(queryClient: QueryClient): () => void {
  const cache = queryClient.getQueryCache();
  return cache.subscribe((event) => {
    if (event.type !== "updated") return;
    const query = event.query;
    if (!isSuccessfulQuery(query)) return;
    if (!shouldPersistQueryKey(query.queryKey)) return;
    void saveQueryRecord({
      savedAt: Date.now(),
      queryKey: [...query.queryKey],
      data: query.state.data,
    });
  });
}
