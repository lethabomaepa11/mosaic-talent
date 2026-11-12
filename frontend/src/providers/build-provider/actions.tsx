import { createAction } from "redux-actions";
import type { BuildInvitation, BuildState } from "./context";
export enum BuildActionTypes { PENDING = "BUILD_PENDING", SUCCESS = "BUILD_SUCCESS", ERROR = "BUILD_ERROR", INVITATIONS = "BUILD_INVITATIONS", INVITATION_HANDLED = "BUILD_INVITATION_HANDLED" }
export const buildPending = createAction(BuildActionTypes.PENDING, () => ({ isPending: true, error: "" }));
export const buildSuccess = createAction(BuildActionTypes.SUCCESS, (data: Partial<BuildState>) => ({ ...data, isPending: false, error: "" }));
export const buildError = createAction(BuildActionTypes.ERROR, (error: string) => ({ isPending: false, error }));
export const buildInvitations = createAction(BuildActionTypes.INVITATIONS, (invitations: BuildInvitation[]) => ({ invitations }));
export const buildInvitationHandled = createAction(BuildActionTypes.INVITATION_HANDLED, (handledInvitationId: string) => ({ handledInvitationId }));
