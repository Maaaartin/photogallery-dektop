import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import Index from './Index';

ReactDOM.render(<Index ipc={ipcRenderer} />, document.getElementById('app'));
