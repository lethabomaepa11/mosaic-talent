import { describe, expect, it } from "vitest";
import {
  fetchNotificationsError,
  fetchNotificationsPending,
  fetchNotificationsSuccess,
  markNotificationsError,
  markNotificationsPending,
  markNotificationsSuccess,
  setPushState,
} from "../actions";
import { INITIAL_STATE } from "../context";
import { NotificationReducer } from "../reducer";

describe("NotificationReducer", () => {
  it("handles fetch state updates", () => {
    const pending = NotificationReducer(INITIAL_STATE, fetchNotificationsPending());
    expect(pending.isPending).toBe(true);

    const success = NotificationReducer(
      pending,
      fetchNotificationsSuccess({
        items: [],
        totalCount: 3,
        unreadCount: 1,
      }),
    );

    expect(success.isPending).toBe(false);
    expect(success.hasLoaded).toBe(true);
    expect(success.totalCount).toBe(3);
    expect(success.unreadCount).toBe(1);

    const errored = NotificationReducer(success, fetchNotificationsError());
    expect(errored.isError).toBe(true);
  });

  it("handles mark state updates", () => {
    const pending = NotificationReducer(INITIAL_STATE, markNotificationsPending());
    expect(pending.isPending).toBe(true);

    const success = NotificationReducer(
      pending,
      markNotificationsSuccess({
        unreadCount: 0,
      }),
    );
    expect(success.unreadCount).toBe(0);
    expect(success.isSuccess).toBe(true);

    const errored = NotificationReducer(success, markNotificationsError());
    expect(errored.isError).toBe(true);
  });

  it("stores push channel flags", () => {
    const next = NotificationReducer(
      INITIAL_STATE,
      setPushState({
        pushSupported: true,
        pushPermission: "granted",
        isPushConfigured: true,
        isPushSubscribed: true,
        vapidPublicKey: "public-key",
      }),
    );

    expect(next.pushSupported).toBe(true);
    expect(next.pushPermission).toBe("granted");
    expect(next.isPushConfigured).toBe(true);
    expect(next.isPushSubscribed).toBe(true);
    expect(next.vapidPublicKey).toBe("public-key");
  });
});
