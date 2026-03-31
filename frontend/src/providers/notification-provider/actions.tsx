import { createAction } from "redux-actions";
import { INotificationStateContext } from "./context";

type NotificationStatePatch = Partial<INotificationStateContext>;

export enum NotificationStateEnums {
  NOTIFICATION_FETCH_PENDING = "NOTIFICATION_FETCH_PENDING",
  NOTIFICATION_FETCH_SUCCESS = "NOTIFICATION_FETCH_SUCCESS",
  NOTIFICATION_FETCH_ERROR = "NOTIFICATION_FETCH_ERROR",
  NOTIFICATION_MARK_PENDING = "NOTIFICATION_MARK_PENDING",
  NOTIFICATION_MARK_SUCCESS = "NOTIFICATION_MARK_SUCCESS",
  NOTIFICATION_MARK_ERROR = "NOTIFICATION_MARK_ERROR",
  NOTIFICATION_PUSH_STATE = "NOTIFICATION_PUSH_STATE",
}

export const fetchNotificationsPending = createAction<NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_FETCH_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchNotificationsSuccess = createAction<NotificationStatePatch, NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_FETCH_SUCCESS,
  (payload) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    hasLoaded: true,
    ...payload,
  }),
);

export const fetchNotificationsError = createAction<NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_FETCH_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const markNotificationsPending = createAction<NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_MARK_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const markNotificationsSuccess = createAction<NotificationStatePatch, NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_MARK_SUCCESS,
  (payload) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    hasLoaded: true,
    ...payload,
  }),
);

export const markNotificationsError = createAction<NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_MARK_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const setPushState = createAction<NotificationStatePatch, NotificationStatePatch>(
  NotificationStateEnums.NOTIFICATION_PUSH_STATE,
  (payload) => payload,
);
