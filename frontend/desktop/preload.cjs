const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("mosaicTalentDesktop", {
  platform: process.platform,
});
