export interface TawkApi {
  onBeforeLoad?: () => void;
  onLoad?: () => void;
  onChatMinimized?: () => void;
  showWidget?: () => void;
  hideWidget?: () => void;
  maximize?: () => void;
}
declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

export const getTawkEmbedUrl = (value?: string): string | null => {
  const url = value?.trim() ?? "";
  return /^https:\/\/embed\.tawk\.to\/[a-f0-9]{24}\/[a-zA-Z0-9]+\/?$/.test(url)
    ? url.replace(/\/$/, "") : null;
};

let widgetPromise: Promise<TawkApi> | undefined;

export const loadTawk = (embedUrl: string): Promise<TawkApi> => {
  const url = getTawkEmbedUrl(embedUrl);
  if (!url) return Promise.reject(new Error("Invalid support configuration"));
  if (widgetPromise) return widgetPromise;

  widgetPromise = new Promise<TawkApi>((resolve, reject) => {
    const script = document.createElement("script");
    const api: TawkApi = {};
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.remove();
      // A late vendor callback must not open a widget after a failed attempt.
      api.onLoad = () => api.hideWidget?.();
      reject(new Error("Support could not load"));
    };
    const timeout = setTimeout(fail, 15_000);
    api.onBeforeLoad = () => api.hideWidget?.();
    api.onChatMinimized = () => api.hideWidget?.();
    api.onLoad = () => {
      if (!api.showWidget || !api.maximize) { fail(); return; }
      settled = true;
      clearTimeout(timeout);
      resolve(api);
    };
    window.Tawk_API = api;
    window.Tawk_LoadStart = new Date();
    script.id = "mosaic-support-widget";
    script.src = url;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => {
    widgetPromise = undefined;
    throw error;
  });
  return widgetPromise;
};
