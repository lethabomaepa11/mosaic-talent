import { createAction } from "redux-actions";
import { IIdeaPost } from "./context";
export enum IdeatorStateEnums { PENDING = "IDEATOR_PENDING", SUCCESS = "IDEATOR_SUCCESS", ERROR = "IDEATOR_ERROR" }
export const ideatorPending = createAction(IdeatorStateEnums.PENDING, () => ({ isPending: true, isError: false }));
export const ideatorSuccess = createAction(IdeatorStateEnums.SUCCESS, (ideas: IIdeaPost[]) => ({ isPending: false, isError: false, ideas }));
export const ideatorError = createAction(IdeatorStateEnums.ERROR, () => ({ isPending: false, isError: true }));
