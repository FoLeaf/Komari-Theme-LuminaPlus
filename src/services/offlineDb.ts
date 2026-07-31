import type { NodeInfo, NodeMetrics } from "@/types/komari";

export const OFFLINE_DB_NAME = "komari-theme-offline";
export const OFFLINE_DB_VERSION = 1;
export const HOME_SNAPSHOT_KEY = "home";
export const QUERY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const STALE_UI_AGE_MS = 24 * 60 * 60 * 1000;
export const INSTANCE_QUERY_LRU = 20;
export const OFFLINE_SNAPSHOT_VERSION = 1;

export type OfflineDataSource = "live" | "cache" | "none";

export interface HomeOfflineSnapshot {
  version: number;
  savedAt: number;
  order: string[];
  metaByUuid: Record<string, NodeInfo>;
  metricsByUuid: Record<string, NodeMetrics>;
}

export interface PersistedQueryRecord {
  savedAt: number;
  queryKey: unknown[];
  data: unknown;
}

const STORE_HOME = "home";
const STORE_QUERIES = "queries";

type StoreName = typeof STORE_HOME | typeof STORE_QUERIES;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("open offline db failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_HOME)) {
        db.createObjectStore(STORE_HOME);
      }
      if (!db.objectStoreNames.contains(STORE_QUERIES)) {
        db.createObjectStore(STORE_QUERIES);
      }
    };
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb request failed"));
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = await idbRequest(run(store));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb tx failed"));
      tx.onabort = () => reject(tx.error ?? new Error("idb tx aborted"));
    });
    return result;
  } finally {
    db.close();
  }
}

export function isHomeOfflineSnapshot(value: unknown): value is HomeOfflineSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === OFFLINE_SNAPSHOT_VERSION &&
    typeof record.savedAt === "number" &&
    Array.isArray(record.order) &&
    record.metaByUuid != null &&
    typeof record.metaByUuid === "object" &&
    record.metricsByUuid != null &&
    typeof record.metricsByUuid === "object"
  );
}

export async function saveHomeSnapshot(snapshot: HomeOfflineSnapshot): Promise<void> {
  await withStore(STORE_HOME, "readwrite", (store) =>
    store.put(snapshot, HOME_SNAPSHOT_KEY),
  );
}

export async function loadHomeSnapshot(): Promise<HomeOfflineSnapshot | null> {
  try {
    const raw = await withStore(STORE_HOME, "readonly", (store) =>
      store.get(HOME_SNAPSHOT_KEY),
    );
    if (!isHomeOfflineSnapshot(raw)) return null;
    if (Date.now() - raw.savedAt > QUERY_MAX_AGE_MS) return null;
    return raw;
  } catch {
    return null;
  }
}

export function serializeQueryKey(queryKey: unknown[]): string {
  return JSON.stringify(queryKey);
}

/** Pure helper: keep at most `limit` instance uuids for records keys; drop oldest by savedAt. */
export function pruneInstanceQueryRecords(
  records: PersistedQueryRecord[],
  limit = INSTANCE_QUERY_LRU,
): PersistedQueryRecord[] {
  const byUuid = new Map<string, { savedAt: number; records: PersistedQueryRecord[] }>();

  for (const record of records) {
    const key = record.queryKey;
    if (!Array.isArray(key) || key[0] !== "records" || typeof key[2] !== "string") {
      continue;
    }
    const uuid = key[2];
    const bucket = byUuid.get(uuid) ?? { savedAt: 0, records: [] };
    bucket.records.push(record);
    bucket.savedAt = Math.max(bucket.savedAt, record.savedAt);
    byUuid.set(uuid, bucket);
  }

  if (byUuid.size <= limit) {
    return records.filter((record) => {
      const key = record.queryKey;
      if (!Array.isArray(key) || key[0] !== "records") return true;
      return typeof key[2] === "string" && byUuid.has(key[2]);
    });
  }

  const ranked = [...byUuid.entries()].sort((a, b) => b[1].savedAt - a[1].savedAt);
  const keep = new Set(ranked.slice(0, limit).map(([uuid]) => uuid));

  return records.filter((record) => {
    const key = record.queryKey;
    if (!Array.isArray(key) || key[0] !== "records") return true;
    return typeof key[2] === "string" && keep.has(key[2]);
  });
}

export function shouldPersistQueryKey(queryKey: unknown): queryKey is unknown[] {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
  const root = queryKey[0];
  return (
    root === "records" ||
    root === "traffic-stats" ||
    root === "public" ||
    root === "cost-rates"
  );
}

export async function saveQueryRecord(record: PersistedQueryRecord): Promise<void> {
  if (!shouldPersistQueryKey(record.queryKey)) return;
  const key = serializeQueryKey(record.queryKey);
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_QUERIES, "readwrite");
    const store = tx.objectStore(STORE_QUERIES);
    await idbRequest(store.put(record, key));

    if (record.queryKey[0] === "records") {
      const allKeys = await idbRequest(store.getAllKeys());
      const allValues = await idbRequest(store.getAll());
      const paired: PersistedQueryRecord[] = [];
      for (const value of allValues) {
        if (
          value &&
          typeof value === "object" &&
          Array.isArray((value as PersistedQueryRecord).queryKey)
        ) {
          paired.push(value as PersistedQueryRecord);
        }
      }
      const pruned = pruneInstanceQueryRecords(paired);
      const keepKeys = new Set(pruned.map((item) => serializeQueryKey(item.queryKey)));
      for (const existing of allKeys) {
        if (
          typeof existing === "string" &&
          existing.startsWith('["records"') &&
          !keepKeys.has(existing)
        ) {
          await idbRequest(store.delete(existing));
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb tx failed"));
      tx.onabort = () => reject(tx.error ?? new Error("idb tx aborted"));
    });
  } finally {
    db.close();
  }
}

export async function loadAllQueryRecords(): Promise<PersistedQueryRecord[]> {
  try {
    const values = await withStore<unknown[]>(STORE_QUERIES, "readonly", (store) =>
      store.getAll(),
    );
    const now = Date.now();
    return values.filter((value): value is PersistedQueryRecord => {
      if (!value || typeof value !== "object") return false;
      const record = value as PersistedQueryRecord;
      return (
        typeof record.savedAt === "number" &&
        now - record.savedAt <= QUERY_MAX_AGE_MS &&
        Array.isArray(record.queryKey)
      );
    });
  } catch {
    return [];
  }
}

export function formatCacheTimeLabel(savedAt: number, now = Date.now()): string {
  const diff = Math.max(0, now - savedAt);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(savedAt);
  } catch {
    return new Date(savedAt).toLocaleString();
  }
}

export function isCacheStale(savedAt: number, now = Date.now()): boolean {
  return now - savedAt > STALE_UI_AGE_MS;
}
