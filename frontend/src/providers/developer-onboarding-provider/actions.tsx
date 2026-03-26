import { createAction } from "redux-actions";
import {
  IDeveloperOnboardingProfile,
  IDeveloperOnboardingStateContext,
  IStudyLevelOption,
} from "./context";

type OnboardingStatePatch = Partial<IDeveloperOnboardingStateContext>;

export enum DeveloperOnboardingStateEnums {
  DEV_ONBOARDING_FETCH_PROFILE_PENDING = "DEV_ONBOARDING_FETCH_PROFILE_PENDING",
  DEV_ONBOARDING_FETCH_PROFILE_SUCCESS = "DEV_ONBOARDING_FETCH_PROFILE_SUCCESS",
  DEV_ONBOARDING_FETCH_PROFILE_ERROR = "DEV_ONBOARDING_FETCH_PROFILE_ERROR",
  DEV_ONBOARDING_FETCH_LEVELS_PENDING = "DEV_ONBOARDING_FETCH_LEVELS_PENDING",
  DEV_ONBOARDING_FETCH_LEVELS_SUCCESS = "DEV_ONBOARDING_FETCH_LEVELS_SUCCESS",
  DEV_ONBOARDING_FETCH_LEVELS_ERROR = "DEV_ONBOARDING_FETCH_LEVELS_ERROR",
  DEV_ONBOARDING_SAVE_PENDING = "DEV_ONBOARDING_SAVE_PENDING",
  DEV_ONBOARDING_SAVE_SUCCESS = "DEV_ONBOARDING_SAVE_SUCCESS",
  DEV_ONBOARDING_SAVE_ERROR = "DEV_ONBOARDING_SAVE_ERROR",
}

export const fetchProfilePending = createAction<OnboardingStatePatch>(
  DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_PROFILE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchProfileSuccess = createAction<
  OnboardingStatePatch,
  IDeveloperOnboardingProfile
>(DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_PROFILE_SUCCESS, (profile) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  profile,
}));

export const fetchProfileError = createAction<OnboardingStatePatch>(
  DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_PROFILE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchLevelsPending = createAction<OnboardingStatePatch>(
  DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_LEVELS_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchLevelsSuccess = createAction<
  OnboardingStatePatch,
  IStudyLevelOption[]
>(DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_LEVELS_SUCCESS, (studyLevels) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  studyLevels,
}));

export const fetchLevelsError = createAction<OnboardingStatePatch>(
  DeveloperOnboardingStateEnums.DEV_ONBOARDING_FETCH_LEVELS_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const savePending = createAction<OnboardingStatePatch>(
  DeveloperOnboardingStateEnums.DEV_ONBOARDING_SAVE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const saveSuccess = createAction<
  OnboardingStatePatch,
  IDeveloperOnboardingProfile
>(DeveloperOnboardingStateEnums.DEV_ONBOARDING_SAVE_SUCCESS, (profile) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  profile,
}));

export const saveError = createAction<OnboardingStatePatch>(
  DeveloperOnboardingStateEnums.DEV_ONBOARDING_SAVE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
