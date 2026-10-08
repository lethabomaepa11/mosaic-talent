import { handleActions } from "redux-actions";
import { INITIAL_STATE, ICompanyAccountStateContext } from "./context";
import { CompanyAccountStateEnums } from "./actions";

type CompanyStatePatch = Partial<ICompanyAccountStateContext>;

export const CompanyAccountReducer = handleActions<
  ICompanyAccountStateContext,
  CompanyStatePatch
>(
  {
    [CompanyAccountStateEnums.COMPANY_ACCOUNT_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyAccountStateEnums.COMPANY_ACCOUNT_CREATE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyAccountStateEnums.COMPANY_ACCOUNT_FETCH_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyAccountStateEnums.COMPANY_ACCOUNT_EMPLOYEES_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [CompanyAccountStateEnums.COMPANY_ACCOUNT_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
