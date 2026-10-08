import { describe, expect, it } from "vitest";
import {
  fetchNotificationsError,
  fetchNotificationsPending,
  fetchNotificationsSuccess,
  markNotificationsError,
  markNotificationsPending,
  markNotificationsSuccess,
  NotificationStateEnums,
  setPushState,
} from "../actions";

describe("notification actions", () => {
  it("creates fetch lifecycle payloads", () => {
    expect(fetchNotificationsPending()).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_FETCH_PENDING,
      payload: {
        isPending: true,
        isSuccess: false,
        isError: false,
      },
    });

    expect(
      fetchNotificationsSuccess({
        items: [],
        totalCount: 0,
        unreadCount: 0,
      }),
    ).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_FETCH_SUCCESS,
      payload: {
        hasLoaded: true,
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });

    expect(fetchNotificationsError()).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_FETCH_ERROR,
      payload: {
        isPending: false,
        isSuccess: false,
        isError: true,
      },
    });
  });

  it("creates mark lifecycle payloads", () => {
    expect(markNotificationsPending()).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_MARK_PENDING,
      payload: {
        isPending: true,
      },
    });

    expect(
      markNotificationsSuccess({
        unreadCount: 2,
      }),
    ).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_MARK_SUCCESS,
      payload: {
        hasLoaded: true,
        unreadCount: 2,
      },
    });

    expect(markNotificationsError()).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_MARK_ERROR,
      payload: {
        isError: true,
      },
    });
  });

  it("creates push state payload", () => {
    expect(
      setPushState({
        pushSupported: true,
        pushPermission: "granted",
        isPushConfigured: true,
        isPushSubscribed: true,
        vapidPublicKey: "public-key",
      }),
    ).toMatchObject({
      type: NotificationStateEnums.NOTIFICATION_PUSH_STATE,
      payload: {
        pushSupported: true,
        pushPermission: "granted",
        isPushConfigured: true,
        isPushSubscribed: true,
        vapidPublicKey: "public-key",
      },
    });
  });
});
