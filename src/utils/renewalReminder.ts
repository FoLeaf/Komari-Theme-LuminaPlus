import type { NodeInfo } from "@/types/komari";
import { formatRenewalPrice } from "@/utils/billing";
import { getExpireDaysRemaining, resolveExpireTimestamp } from "@/utils/format";

const DAY_MS = 86_400_000;

export const RENEWAL_WARNING_DAYS = 7;
export const RENEWAL_SNOOZE_DAYS = 1;
export const RENEWAL_SNOOZE_MS = RENEWAL_SNOOZE_DAYS * DAY_MS;

export type RenewalReminderSource = Pick<
  NodeInfo,
  | "uuid"
  | "name"
  | "weight"
  | "price"
  | "currency"
  | "billing_cycle"
  | "auto_renewal"
  | "expired_at"
>;

interface RenewalReminderItem {
  uuid: string;
  name: string;
  cycleKey: string;
  expiresAt: number;
  daysRemaining: number;
  priceLabel: string;
  autoRenewal: boolean;
  tone: "critical" | "warning" | "success";
  statusLabel: string;
}

export interface RenewalReminderPreferences {
  dismissedCycles: string[];
  snoozedUntil: Record<string, number>;
}

export const EMPTY_RENEWAL_REMINDER_PREFERENCES: RenewalReminderPreferences = {
  dismissedCycles: [],
  snoozedUntil: {},
};

export function renewalCycleKey(node: RenewalReminderSource, expiresAt?: number) {
  const resolved = expiresAt ?? resolveExpireTimestamp(node.expired_at);
  return resolved == null ? null : `${node.uuid}:${resolved}`;
}

export function getRenewalReminders(
  nodes: RenewalReminderSource[],
  now = Date.now(),
): RenewalReminderItem[] {
  const reminders: RenewalReminderItem[] = [];

  for (const node of nodes) {
    const expiresAt = resolveExpireTimestamp(node.expired_at);
    if (expiresAt == null) continue;

    // 与节点卡、列表和资产页共用同一套向下取整口径，避免同屏出现 2 天/3 天。
    const daysRemaining = getExpireDaysRemaining(expiresAt, now);
    if (daysRemaining == null) continue;
    if (daysRemaining > RENEWAL_WARNING_DAYS) continue;

    const expired = daysRemaining < 0;
    const critical = daysRemaining <= 3;
    reminders.push({
      uuid: node.uuid,
      name: node.name?.trim() || node.uuid,
      cycleKey: `${node.uuid}:${expiresAt}`,
      expiresAt,
      daysRemaining,
      priceLabel:
        formatRenewalPrice({
          price: node.price,
          currency: node.currency,
          billing_cycle: node.billing_cycle,
          expired_at: node.expired_at,
        }) ?? "价格未设置",
      autoRenewal: node.auto_renewal,
      tone: expired || critical ? "critical" : node.auto_renewal ? "success" : "warning",
      statusLabel: expired
        ? "已过期"
        : node.auto_renewal
          ? "自动续费已开启"
          : "即将到期",
    });
  }

  return reminders.sort(
    (a, b) => a.daysRemaining - b.daysRemaining || a.name.localeCompare(b.name, "zh-CN"),
  );
}

export function formatRenewalReminderExpiry(daysRemaining: number) {
  if (daysRemaining < 0) return `已过期 ${Math.abs(daysRemaining)} 天`;
  if (daysRemaining === 0) return "今日到期";
  return `${daysRemaining} 天后到期`;
}

export function getVisibleRenewalReminders(
  reminders: RenewalReminderItem[],
  preferences: RenewalReminderPreferences,
  now = Date.now(),
) {
  const dismissed = new Set(preferences.dismissedCycles);
  return reminders.filter(
    (item) =>
      !dismissed.has(item.cycleKey) &&
      !(Number(preferences.snoozedUntil[item.cycleKey]) > now),
  );
}
