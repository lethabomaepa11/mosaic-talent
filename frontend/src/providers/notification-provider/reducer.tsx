import { handleActions } from "redux-actions";
import { NotificationStateEnums } from "./actions";
import { INITIAL_STATE, INotificationStateContext } from "./context";

type NotificationStatePatch = Partial<INotificationStateContext>;

export const NotificationReducer = handleActions<
  INotificationStateContext,
  NotificationStatePatch
>(
  {
    [NotificationStateEnums.NOTIFICATION_FETCH_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [NotificationStateEnums.NOTIFICATION_FETCH_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [NotificationStateEnums.NOTIFICATION_FETCH_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [NotificationStateEnums.NOTIFICATION_MARK_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [NotificationStateEnums.NOTIFICATION_MARK_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [NotificationStateEnums.NOTIFICATION_MARK_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [NotificationStateEnums.NOTIFICATION_PUSH_STATE]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
