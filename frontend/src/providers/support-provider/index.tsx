"use client";
import { useContext, useReducer, type PropsWithChildren } from "react";
import { SupportActionContext, SupportStateContext, INITIAL_STATE } from "./context";
import { openError, openPending, openSuccess } from "./actions";
import { SupportReducer } from "./reducer";
import { getTawkEmbedUrl, loadTawk } from "./tawk";

export const SupportProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(SupportReducer, INITIAL_STATE);
  const openSupport = async () => {
    const embedUrl = getTawkEmbedUrl(process.env.NEXT_PUBLIC_TAWK_EMBED_URL
      ?? "https://embed.tawk.to/6af5d41ae84c933e6cc134c5/1k7849236");
    if (!embedUrl) {
      dispatch(openError("Support messaging isn't available right now. Please try again later or read the getting started guide."));
      return false;
    }
    dispatch(openPending());
    try {
      const api = await loadTawk(embedUrl);
      api.showWidget!();
      api.maximize!();
      dispatch(openSuccess());
      return true;
    } catch {
      dispatch(openError("Support couldn't load. Check your connection or allow tawk.to in your browser, then try again."));
      return false;
    }
  };
  return <SupportStateContext.Provider value={state}>
    <SupportActionContext.Provider value={{ openSupport }}>{children}</SupportActionContext.Provider>
  </SupportStateContext.Provider>;
};
export const useSupportState = () => useContext(SupportStateContext);
export const useSupportAction = () => useContext(SupportActionContext);
