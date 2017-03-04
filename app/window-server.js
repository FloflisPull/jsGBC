const { BrowserWindow, ipcMain } = require("electron");
const EventEmitter = require("events");
const url = require("url");

class WindowServer extends EventEmitter {
  constructor(url, options) {
    super();
    this.url = url;
    this.windowOptions = options;
  }

  open(options) {
    if (this.isWindowOpen) return;
    this.window = new BrowserWindow(options || this.windowOptions);

    const indexUrl = url.format({
      pathname: this.url,
      protocol: "file:",
      slashes: true
    });

    this.window.on("enter-full-screen", () => {
      if (this.requestedFromClient) {
        this.requestedFromClient = false;
      } else {
        this.sendToClient("requestFullscreen");
      }

      this.window.setResizable(true);
    }).on("leave-full-screen", () => {
      if (this.requestedFromClient) {
        this.requestedFromClient = false;
      } else {
        this.sendToClient("cancelFullscreen");
      }

      this.window.setResizable(false);
    });

    ipcMain.on("ready", () => {
      this.isClientReady = true;
      this.emit("clientReady");
    }).on("requestFullscreen", () => {
      this.requestedFromClient = true;
      this.window.setFullScreen(true);
    }).on("cancelFullscreen", () => {
      this.requestedFromClient = true;
      this.window.setFullScreen(false);
    });

    this.window.loadURL(indexUrl);
    this.window.on("closed", () => {
      this.isClientReady = false;
      this.window = null;
      this.emit("closed");
    });
  }

  sendToClient(name, options) {
    this.window.webContents.send(name, options);
  }

  get isWindowOpen() {
    return !!this.window;
  }
}

module.exports = WindowServer;
