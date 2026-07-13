import { describe, expect, it } from "vitest";
import type { RenewalReminderSource } from "@/utils/renewalReminder";
import {
  getRenewalReminders,
  getVisibleRenewalReminders,
  RENEWAL_SNOOZE_MS,
  renewalCycleKey,
} from "@/utils/renewalReminder";
import { getExpireDaysRemaining } from "@/utils/format";

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 6, 12, 0, 0, 0);

function inDays(days: number) {
  return new Date(NOW + days * DAY_MS).toISOString();
}

function node(overrides: Partial<RenewalReminderSource> = {}): RenewalReminderSource {
  return {
    uuid: "node-1",
    name: "Tokyo Edge",
    weight: 1,
    price: 12,
    currency: "$",
    billing_cycle: "month",
    auto_renewal: false,
    expired_at: inDays(7),
    ...overrides,
  };
}

describe("renewal reminders", () => {
  it("keeps only nodes due within 7 days and sorts the most urgent first", () => {
    const reminders = getRenewalReminders(
      [
        node({ uuid: "later", name: "Later", expired_at: inDays(8) }),
        node({ uuid: "soon", name: "Soon", expired_at: inDays(7), auto_renewal: true }),
        node({ uuid: "urgent", name: "Urgent", expired_at: inDays(3) }),
        node({ uuid: "none", name: "No expiry", expired_at: "" }),
      ],
      NOW,
    );

    expect(reminders.map((item) => item.uuid)).toEqual(["urgent", "soon"]);
    expect(reminders[0]).toMatchObject({
      daysRemaining: 3,
      tone: "critical",
      statusLabel: "即将到期",
    });
    expect(reminders[1]).toMatchObject({
      daysRemaining: 7,
      tone: "success",
      statusLabel: "自动续费已开启",
    });
  });

  it("snoozes reminders for exactly one day", () => {
    expect(RENEWAL_SNOOZE_MS).toBe(DAY_MS);
  });

  it("uses the same whole-day rounding as cards and the assets page", () => {
    const expiresAt = NOW + 3 * DAY_MS - 1;
    const [reminder] = getRenewalReminders(
      [node({ expired_at: new Date(expiresAt).toISOString() })],
      NOW,
    );
    expect(reminder.daysRemaining).toBe(2);
    expect(reminder.daysRemaining).toBe(getExpireDaysRemaining(expiresAt, NOW));
  });

  it("binds dismissal to the exact expiry cycle", () => {
    const current = node({ expired_at: inDays(3) });
    const renewed = node({ expired_at: inDays(33) });

    expect(renewalCycleKey(current)).not.toBe(renewalCycleKey(renewed));
  });

  it("hides dismissed and currently snoozed cycles, then restores expired snoozes", () => {
    const reminders = getRenewalReminders(
      [node({ uuid: "dismiss" }), node({ uuid: "snooze" }), node({ uuid: "visible" })],
      NOW,
    );
    const key = (uuid: string) => reminders.find((item) => item.uuid === uuid)!.cycleKey;
    const preferences = {
      dismissedCycles: [key("dismiss")],
      snoozedUntil: { [key("snooze")]: NOW + DAY_MS },
    };

    expect(getVisibleRenewalReminders(reminders, preferences, NOW).map((item) => item.uuid)).toEqual([
      "visible",
    ]);
    expect(
      getVisibleRenewalReminders(reminders, preferences, NOW + 2 * DAY_MS).map((item) => item.uuid),
    ).toEqual(["snooze", "visible"]);
  });
});
