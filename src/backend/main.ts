import { app, BrowserWindow, ipcMain } from 'electron';
import { Server } from 'http';
import { default as express } from './server';
import { MainWindowState } from '../interfaces';
import { isDevelopment, IpcMessage } from '../constants';

// https://github.com/danzel/electron-compile-builder-typescript-example

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow;
let server: Server;

function send(channel: IpcMessage, message: MainWindowState): void {
  if (mainWindow) mainWindow.webContents.send(channel, message);
};

function serverSuccessHandler(result: Server, message: string): void {
  server = result;
  send(IpcMessage.UPDATE_STATUS, { status: message, runnning: true });
}

function serverErrorHandler(err: Error): void {
  server = null;
  send(IpcMessage.UPDATE_STATUS, { status: `Error: ${err.message}`, runnning: false });
}

function createServer(port?: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    if (port) express.set('port', port);
    const newServer = express.listen(express.get('port'), () => {
      console.log('Express server listening on port ' + express.get('port'));
      resolve(newServer);
    });
    newServer.on('error', err => {
      console.log(err.message);
      reject(err);
    });
  });
};

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow();

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  window.loadFile('src/frontend/index.html');

  window.webContents.on('did-finish-load', () => {
    send(IpcMessage.UPDATE_STATUS, {
      status: server ? 'Server started' : 'Server not running',
      runnning: !!server
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
    if (server) {
      server.close(() => {
        console.log('Server closed');
        send(IpcMessage.UPDATE_STATUS, { status: 'Server closed', runnning: false });
        createServer(data.port)
          .then(result => serverSuccessHandler(result, 'Server started with changed port'))
          .catch(serverErrorHandler);
      });
    }
  });

  ipcMain.on(IpcMessage.START_SERVER, (event, data: MainWindowState | undefined) => {
    if (!server) {
      createServer()
        .then(result => serverSuccessHandler(result, 'Server started'))
        .catch(serverErrorHandler);
    }
  });

  ipcMain.on(IpcMessage.STOP_SERVER, (event, data: MainWindowState) => {
    if (server) {
      server.close(() => {
        console.log('Server closed');
        server = null;
        send(IpcMessage.UPDATE_STATUS, { status: 'Server stopped', runnning: false });
      });
    }
  });

  return window;
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
    })
    .catch(serverErrorHandler);
});

