import { handleActions } from "redux-actions";
import { INITIAL_STATE, ITenantResolutionStateContext } from "./context";
import { TenantResolutionStateEnums } from "./actions";

type TenantStatePatch = Partial<ITenantResolutionStateContext>;

export const TenantResolutionReducer = handleActions<
  ITenantResolutionStateContext,
  TenantStatePatch
>(
  {
    [TenantResolutionStateEnums.TENANT_RESOLUTION_PENDING]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [TenantResolutionStateEnums.TENANT_RESOLUTION_SUCCESS]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [TenantResolutionStateEnums.TENANT_RESOLUTION_ERROR]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
