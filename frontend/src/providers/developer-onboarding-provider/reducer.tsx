import { handleActions } from "redux-actions";
import { INITIAL_STATE, IDeveloperOnboardingStateContext } from "./context";
import { DeveloperOnboardingStateEnums } from "./actions";

type OnboardingStatePatch = Partial<IDeveloperOnboardingStateContext>;

export const DeveloperOnboardingReducer = handleActions<
  IDeveloperOnboardingStateContext,
  OnboardingStatePatch
>(
  {
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_PROFILE_PENDING]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_PROFILE_SUCCESS]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_PROFILE_ERROR]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_LEVELS_PENDING]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_LEVELS_SUCCESS]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_LEVELS_ERROR]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_SAVE_PENDING]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_SAVE_SUCCESS]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
    [DeveloperOnboardingStateEnums.DEV_ONBOARDING_SAVE_ERROR]: (
      state,
      { payload },
    ) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
