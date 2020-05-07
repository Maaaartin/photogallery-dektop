import { app, BrowserWindow, ipcMain } from 'electron';
import { default as express } from './server';
import { Server } from 'http';
//import {enableLiveReload} from 'electron-compile';

//enableLiveReload();
// https://github.com/danzel/electron-compile-builder-typescript-example
const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow;
let server: Server;

function createServer(port: number): Server {
  return express.listen(port, () => console.log('Express server listening on port ' + port));
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow();

  window.webContents.on('did-finish-load', () => {
    ipcMain.on('changePort', (event, data) => {
      server.close(() => {
        console.log('Server closed');
        server = createServer(data.port);
      });

    })
    window.webContents.send('test', { data: 'test' });
  });

  // ipcRenderer.on('changePort', (event, data) => {
  //   console.log(data);
  // })

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  window.loadFile('src/frontend/index.html');
  //window.loadURL('file://' + __dirname + '/index.html');

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })


  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  server = createServer(express.get('port'));
});

