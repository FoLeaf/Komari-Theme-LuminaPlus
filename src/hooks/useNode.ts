import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  ensureStarted,
  getAllNodeMetaSnapshot,
  getHomeNodeSummariesSnapshot,
  getNodeMetaSnapshot,
  getNodeMetricsSnapshot,
  getNodeTrafficTrendSnapshot,
  getVisibleNodeUuidsSnapshot,
  subscribeHomeNodeSummaries,
  subscribeAllNodes,
  subscribeStoreStatus,
  subscribeVisibleNodeUuids,
  subscribeToNodeMeta,
  subscribeToNodeMetrics,
  subscribeToNodeTrafficTrend,
  getStoreStatusSnapshot,
  type HomeNodeSummary,
} from "@/services/wsStore";
import type { NodeInfo, NodeMetrics, TrafficTrendSample } from "@/types/komari";

const noopUnsubscribe = () => undefined;

function useEnsured(enabled = true) {
  useEffect(() => {
    if (enabled) ensureStarted();
  }, [enabled]);
}

export function useNodeMeta(uuid: string): NodeInfo | undefined {
  useEnsured();
  const subscribe = useCallback(
    (callback: () => void) => subscribeToNodeMeta(uuid, callback),
    [uuid],
  );
  const getSnapshot = useCallback(() => getNodeMetaSnapshot(uuid), [uuid]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useNodeMetrics(uuid: string, enabled = true): NodeMetrics | undefined {
  useEnsured(enabled);
  const subscribe = useCallback(
    (callback: () => void) =>
      enabled ? subscribeToNodeMetrics(uuid, callback) : noopUnsubscribe,
    [uuid, enabled],
  );
  const getSnapshot = useCallback(
    () => (enabled ? getNodeMetricsSnapshot(uuid) : undefined),
    [uuid, enabled],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useNodeTrafficTrend(
  uuid: string,
): { up: TrafficTrendSample[]; down: TrafficTrendSample[] } {
  useEnsured();
  const subscribe = useCallback(
    (callback: () => void) => subscribeToNodeTrafficTrend(uuid, callback),
    [uuid],
  );
  const getSnapshot = useCallback(() => getNodeTrafficTrendSnapshot(uuid), [uuid]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useVisibleNodeUuids(includeHidden = false): string[] {
  useEnsured();
  const getSnapshot = useCallback(
    () => getVisibleNodeUuidsSnapshot(includeHidden),
    [includeHidden],
  );
  return useSyncExternalStore(
    subscribeVisibleNodeUuids,
    getSnapshot,
    getSnapshot,
  );
}

export function useAllNodeMeta(): NodeInfo[] {
  useEnsured();
  return useSyncExternalStore(
    subscribeAllNodes,
    getAllNodeMetaSnapshot,
    getAllNodeMetaSnapshot,
  );
}

export function useHomeNodeSummaries(): HomeNodeSummary[] {
  useEnsured();
  return useSyncExternalStore(
    subscribeHomeNodeSummaries,
    getHomeNodeSummariesSnapshot,
    getHomeNodeSummariesSnapshot,
  );
}

export function useNodeStoreStatus() {
  useEnsured();
  return useSyncExternalStore(
    subscribeStoreStatus,
    getStoreStatusSnapshot,
    getStoreStatusSnapshot,
  );
}
