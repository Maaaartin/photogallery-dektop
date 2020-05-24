export const dirName = './img/';
export const isDevelopment = process.env.NODE_ENV !== 'production';
export enum IpcMessage {
    START_SERVER = 'startServer',
    STOP_SERVER = 'stopServer',
    CHANGE_PORT = 'changePort',
    UPDATE_STATUS = 'updateStatus',
    OPEN_BROWSER = 'openBrowser';
};