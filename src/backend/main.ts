import { app, BrowserWindow, ipcMain } from 'electron';
import { Server } from 'http';
import * as open from 'open';

import { default as express } from './server';
import { MainWindowState } from '../interfaces';
import { isDevelopment, IpcMessage } from '../constants';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow;
let server: Server;

/**
 * Opens default browser on localhost and appropriate port
 */
function openBrowser() {
  if (server) open(`http://localhost:${server.address().port}`);
}

/**
 * Sends data to main window
 * @param channel Channel type
 * @param message Message content
 */
function send(channel: IpcMessage, message: MainWindowState): void {
  if (mainWindow) mainWindow.webContents.send(channel, message);
};

/**
 * Handles server creation success
 * @param result Created server instance
 * @param message Message to be sent to main window
 */
function serverSuccessHandler(result: Server, message: string): void {
  server = result;
  send(IpcMessage.UPDATE_STATUS, { status: message, runnning: true, servePort: server.address().port, disable: false });
}

/**
 * Handles server creation error
 */
function serverErrorHandler(err: Error): void {
  server = null;
  send(IpcMessage.UPDATE_STATUS, { status: `Error: ${err.message}`, runnning: false, disable: false });
}

/**
 * Creates new http server instance running on @param port
 * @param port Server port number
 */
function createServer(port?: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    if (port) express.set('port', port);
    const newServer = express.listen(express.get('port'), 'localhost', () => {
      console.log('Express server listening on port ' + express.get('port'));
      resolve(newServer);
    });
    newServer.on('error', err => {
      console.log(err.message);
      reject(err);
    });
  });
};

/**
 * Creates new BrowserWindow instance
 */
function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 600,
    height: 200,
    maximizable: false,
    resizable: false
  });

  // window.webContents.openDevTools();

  window.setMenu(null);

  window.loadFile('src/frontend/index.html');

  window.webContents.on('did-finish-load', () => {
    send(IpcMessage.UPDATE_STATUS, {
      status: server ? 'Server started' : 'Server not running',
      runnning: !!server,
      servePort: server && server.address().port,
      disable: false
    });
  });

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    setImmediate(() => {
      window.focus();
    });
  });

  ipcMain.on(IpcMessage.CHANGE_PORT, (event, data: MainWindowState) => {
    console.log('Changing port');
    send(IpcMessage.UPDATE_STATUS, { status: 'Applying changes, please wait', disable: true });
    if (server) {
      server.close(() => {
        console.log('Server closed');
        send(IpcMessage.UPDATE_STATUS, { status: 'Server closed', runnning: false });
        createServer(data.setPort)
          .then(result => serverSuccessHandler(result, 'Server started with changed port'))
          .catch(serverErrorHandler);
      });
    }
  });

  ipcMain.on(IpcMessage.START_SERVER, (event, data: MainWindowState | undefined) => {
    send(IpcMessage.UPDATE_STATUS, { status: 'Starting server, please wait', disable: true });
    if (!server) {
      createServer()
        .then(result => serverSuccessHandler(result, 'Server started'))
        .catch(serverErrorHandler);
    }
  });

  ipcMain.on(IpcMessage.STOP_SERVER, (event, data: MainWindowState) => {
    console.log('Stopping server');
    send(IpcMessage.UPDATE_STATUS, { status: 'Stopping server, please wait', disable: true });
    if (server) {
      server.close(() => {
        console.log('Server closed');
        server = null;
        send(IpcMessage.UPDATE_STATUS, { status: 'Server stopped', runnning: false, disable: false });
      });
    }
  });

  ipcMain.on(IpcMessage.OPEN_BROWSER, (event, data) => {
    if (server) openBrowser();
  });

  return window;
}

// Force Single Instance Application
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // If minimized, gets restored
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
})

if (shouldQuit) {
  app.quit();
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  createServer()
    .then((result) => {
      server = result;
      openBrowser();
    })
    .catch(serverErrorHandler);
});