import { handleActions } from "redux-actions";
import { CompanyProfileStateEnums } from "./actions";
import { ICompanyProfileStateContext, INITIAL_STATE } from "./context";

type CompanyProfileStatePatch = Partial<ICompanyProfileStateContext>;

export const CompanyProfileReducer = handleActions<
  ICompanyProfileStateContext,
  CompanyProfileStatePatch
>(
  {
    [CompanyProfileStateEnums.COMPANY_PROFILE_FETCH_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyProfileStateEnums.COMPANY_PROFILE_FETCH_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyProfileStateEnums.COMPANY_PROFILE_FETCH_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyProfileStateEnums.COMPANY_PROFILE_SAVE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyProfileStateEnums.COMPANY_PROFILE_SAVE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyProfileStateEnums.COMPANY_PROFILE_SAVE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
