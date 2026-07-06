import { useEffect, useMemo, useState } from "react";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { buildFakePingItem } from "@/utils/fakePing";
import {
  invertHomepagePingTaskBindings,
  type HomepagePingTaskBindings,
} from "@/utils/pingTasks";
import type { PingOverviewItem } from "@/types/komari";

// 每 30s 检查一次分钟槽是否推进(functional update 在槽未变时返回原值,不触发重渲染)。
// 相比对齐整分的 setTimeout 链简单得多,最多 30s 的滞后与真实 ping 的 60s 刷新同量级。
const MINUTE_TICK_MS = 30_000;
const bindingSelectionCache = new WeakMap<HomepagePingTaskBindings, Map<string, number>>();

function currentMinuteIndex() {
  return Math.floor(Date.now() / 60_000);
}

function getCachedBindingSelection(bindings: HomepagePingTaskBindings) {
  const cached = bindingSelectionCache.get(bindings);
  if (cached) return cached;
  const selection = invertHomepagePingTaskBindings(bindings);
  bindingSelectionCache.set(bindings, selection);
  return selection;
}

function useMinuteIndex(enabled: boolean) {
  const [minuteIndex, setMinuteIndex] = useState(currentMinuteIndex);

  useEffect(() => {
    if (!enabled) return;
    // 重新启用时先校准一次:禁用期间 interval 不在跑,槽位可能已落后。
    setMinuteIndex(currentMinuteIndex());
    const timer = window.setInterval(() => {
      setMinuteIndex((prev) => {
        const next = currentMinuteIndex();
        return next === prev ? prev : next;
      });
    }, MINUTE_TICK_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return minuteIndex;
}

/**
 * 首页卡片的"模拟延迟"回退:主题开关(fakePingForUnbound)开启时,未绑定首页 Ping
 * 任务且在线的节点返回一份前端生成的 PingOverviewItem(1-10ms、丢包 0%),其余情况
 * 原样返回真实数据。只影响首页卡片的数据源,实例详情页 PingChart 走的是另一套数据流。
 */
export function useFakePingFallback(
  uuid: string,
  ping: PingOverviewItem,
  isOnline: boolean,
): PingOverviewItem {
  const themeSettings = useThemeSettings();

  // 用主题里的绑定关系(而不是只看 ping.isAssigned)判断"未绑定":已绑定节点在
  // overview 首次加载完成前 isAssigned 同样是 false,只看它会在加载间隙闪一下假数据。
  const boundUuids = useMemo(
    () =>
      themeSettings.fakePingForUnbound
        ? getCachedBindingSelection(themeSettings.homepagePingBindings)
        : null,
    [themeSettings.fakePingForUnbound, themeSettings.homepagePingBindings],
  );

  // 离线节点不注入:真实监控在节点离线时会丢包/断样本,绿色 1-10ms 会穿帮,
  // 保持"未配置"占位反而自然。
  const shouldFake =
    isOnline &&
    boundUuids != null &&
    !boundUuids.has(uuid) &&
    !ping.isAssigned;

  const minuteIndex = useMinuteIndex(shouldFake);

  return useMemo(
    () => (shouldFake ? buildFakePingItem(uuid, minuteIndex) : ping),
    [shouldFake, uuid, minuteIndex, ping],
  );
}
