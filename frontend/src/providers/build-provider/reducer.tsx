import { handleActions } from "redux-actions";
import { BuildActionTypes } from "./actions";
import { INITIAL_STATE, type BuildState } from "./context";
export const BuildReducer = handleActions<BuildState, Partial<BuildState> & { handledInvitationId?: string }>({
  [BuildActionTypes.PENDING]: (state, { payload }) => ({ ...state, ...payload }),
  [BuildActionTypes.SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
  [BuildActionTypes.ERROR]: (state, { payload }) => ({ ...state, ...payload }),
  [BuildActionTypes.INVITATIONS]: (state, { payload }) => ({ ...state, ...payload }),
  [BuildActionTypes.INVITATION_HANDLED]: (state, { payload }) => ({ ...state, invitations: state.invitations.filter(invite => invite.id !== payload.handledInvitationId) }),
}, INITIAL_STATE);
