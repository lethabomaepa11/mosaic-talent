import { createAction } from "redux-actions";
import {
  ICurrentUserSummary,
  IDeveloperProfile,
  IDeveloperStateContext,
  IGamificationSummary,
  IGithubScanResult,
  ILearningPathResult,
  IStudyLevelOption,
} from "./context";

type DeveloperStatePatch = Partial<IDeveloperStateContext>;

export enum DeveloperStateEnums {
  DEVELOPER_FETCH_PROFILE_PENDING = "DEVELOPER_FETCH_PROFILE_PENDING",
  DEVELOPER_FETCH_PROFILE_SUCCESS = "DEVELOPER_FETCH_PROFILE_SUCCESS",
  DEVELOPER_FETCH_PROFILE_ERROR = "DEVELOPER_FETCH_PROFILE_ERROR",
  DEVELOPER_FETCH_LEVELS_PENDING = "DEVELOPER_FETCH_LEVELS_PENDING",
  DEVELOPER_FETCH_LEVELS_SUCCESS = "DEVELOPER_FETCH_LEVELS_SUCCESS",
  DEVELOPER_FETCH_LEVELS_ERROR = "DEVELOPER_FETCH_LEVELS_ERROR",
  DEVELOPER_FETCH_USER_PENDING = "DEVELOPER_FETCH_USER_PENDING",
  DEVELOPER_FETCH_USER_SUCCESS = "DEVELOPER_FETCH_USER_SUCCESS",
  DEVELOPER_FETCH_USER_ERROR = "DEVELOPER_FETCH_USER_ERROR",
  DEVELOPER_SAVE_PROFILE_PENDING = "DEVELOPER_SAVE_PROFILE_PENDING",
  DEVELOPER_SAVE_PROFILE_SUCCESS = "DEVELOPER_SAVE_PROFILE_SUCCESS",
  DEVELOPER_SAVE_PROFILE_ERROR = "DEVELOPER_SAVE_PROFILE_ERROR",
  DEVELOPER_SCAN_GITHUB_PENDING = "DEVELOPER_SCAN_GITHUB_PENDING",
  DEVELOPER_SCAN_GITHUB_SUCCESS = "DEVELOPER_SCAN_GITHUB_SUCCESS",
  DEVELOPER_SCAN_GITHUB_ERROR = "DEVELOPER_SCAN_GITHUB_ERROR",
  DEVELOPER_FETCH_LEARNING_PATH_PENDING = "DEVELOPER_FETCH_LEARNING_PATH_PENDING",
  DEVELOPER_FETCH_LEARNING_PATH_SUCCESS = "DEVELOPER_FETCH_LEARNING_PATH_SUCCESS",
  DEVELOPER_FETCH_LEARNING_PATH_ERROR = "DEVELOPER_FETCH_LEARNING_PATH_ERROR",
  DEVELOPER_FETCH_GAMIFICATION_PENDING = "DEVELOPER_FETCH_GAMIFICATION_PENDING",
  DEVELOPER_FETCH_GAMIFICATION_SUCCESS = "DEVELOPER_FETCH_GAMIFICATION_SUCCESS",
  DEVELOPER_FETCH_GAMIFICATION_ERROR = "DEVELOPER_FETCH_GAMIFICATION_ERROR",
}

export const fetchProfilePending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_PROFILE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchProfileSuccess = createAction<
  DeveloperStatePatch,
  IDeveloperProfile
>(DeveloperStateEnums.DEVELOPER_FETCH_PROFILE_SUCCESS, (profile) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  profile,
}));

export const fetchProfileError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_PROFILE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchLevelsPending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_LEVELS_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchLevelsSuccess = createAction<
  DeveloperStatePatch,
  IStudyLevelOption[]
>(DeveloperStateEnums.DEVELOPER_FETCH_LEVELS_SUCCESS, (studyLevels) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  studyLevels,
}));

export const fetchLevelsError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_LEVELS_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchUserPending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_USER_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchUserSuccess = createAction<
  DeveloperStatePatch,
  ICurrentUserSummary
>(DeveloperStateEnums.DEVELOPER_FETCH_USER_SUCCESS, (currentUser) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  currentUser,
}));

export const fetchUserError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_USER_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const saveProfilePending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_SAVE_PROFILE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const saveProfileSuccess = createAction<
  DeveloperStatePatch,
  IDeveloperProfile
>(DeveloperStateEnums.DEVELOPER_SAVE_PROFILE_SUCCESS, (profile) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  profile,
}));

export const saveProfileError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_SAVE_PROFILE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const scanGithubPending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_SCAN_GITHUB_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const scanGithubSuccess = createAction<
  DeveloperStatePatch,
  IGithubScanResult
>(DeveloperStateEnums.DEVELOPER_SCAN_GITHUB_SUCCESS, (scanResult) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  scanResult,
}));

export const scanGithubError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_SCAN_GITHUB_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const fetchLearningPathPending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_LEARNING_PATH_PENDING,
  () => ({
    isLearningPathPending: true,
  }),
);

export const fetchLearningPathSuccess = createAction<
  DeveloperStatePatch,
  ILearningPathResult
>(DeveloperStateEnums.DEVELOPER_FETCH_LEARNING_PATH_SUCCESS, (learningPath) => ({
  isLearningPathPending: false,
  learningPath,
}));

export const fetchLearningPathError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_LEARNING_PATH_ERROR,
  () => ({
    isLearningPathPending: false,
  }),
);

export const fetchGamificationPending = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_GAMIFICATION_PENDING,
  () => ({
    isGamificationPending: true,
  }),
);

export const fetchGamificationSuccess = createAction<
  DeveloperStatePatch,
  IGamificationSummary
>(DeveloperStateEnums.DEVELOPER_FETCH_GAMIFICATION_SUCCESS, (gamificationSummary) => ({
  isGamificationPending: false,
  gamificationSummary,
}));

export const fetchGamificationError = createAction<DeveloperStatePatch>(
  DeveloperStateEnums.DEVELOPER_FETCH_GAMIFICATION_ERROR,
  () => ({
    isGamificationPending: false,
  }),
);
