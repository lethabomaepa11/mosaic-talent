/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const appUrl = process.env.MOSAIC_TALENT_DESKTOP_URL || "https://mosaic-talent.vercel.app";
const appOrigin = (() => {
  try {
    return new URL(appUrl).origin;
  } catch {
    return "";
  }
})();

const isSafeExternalUrl = (targetUrl) => {
  try {
    const parsed = new URL(targetUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const createMainWindow = () => {
  const window = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isSafeExternalUrl(targetUrl)) {
      event.preventDefault();
      return;
    }

    if (appOrigin && new URL(targetUrl).origin !== appOrigin) {
      event.preventDefault();
      void shell.openExternal(targetUrl);
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  void window.loadURL(appUrl);
};

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
