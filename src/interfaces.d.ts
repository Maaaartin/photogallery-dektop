import { Request } from 'express';
import { Fields } from 'formidable';
import * as Jimp from 'jimp';
import { IpcRenderer } from 'electron';

export interface Gallery {
    files: string[];
}
export interface Error {
    message: string;
}
export interface Index {
    title: string;
}

export interface CountRequest extends Request {
    params: {
        count: number | undefined
    }
}

export interface TitleReq extends Request {
    params: {
        title: string | undefined
    }
}

export interface NameReq extends Request {
    params: {
        title: string | undefined,
        name: string | undefined
    }
}

export interface UploadFormFields extends Fields {
    height: string | undefined,
    width: string | undefined,
    previews: string | undefined,
    title: string | undefined
}

export interface NameJimp extends Jimp {
    name: string
}

export interface MainWindowProps {
    ipc: IpcRenderer
}

export interface MainWindowState {
    port?: number,
    status?: string,
    runnning?: boolean
}