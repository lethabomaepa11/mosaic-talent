import { createAction } from "redux-actions";
import type { ISupportState } from "./context";

export enum SupportStateEnums {
  OPEN_PENDING = "SUPPORT_OPEN_PENDING",
  OPEN_SUCCESS = "SUPPORT_OPEN_SUCCESS",
  OPEN_ERROR = "SUPPORT_OPEN_ERROR",
}
export const openPending = createAction<Partial<ISupportState>>(
  SupportStateEnums.OPEN_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false, error: undefined }),
);
export const openSuccess = createAction<Partial<ISupportState>>(
  SupportStateEnums.OPEN_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false, error: undefined }),
);
export const openError = createAction<Partial<ISupportState>, string>(
  SupportStateEnums.OPEN_ERROR,
  error => ({ isPending: false, isSuccess: false, isError: true, error }),
);
