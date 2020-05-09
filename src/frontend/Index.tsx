import * as React from 'react';
import { Row, Col } from 'react-flexbox-grid';
import { MainWindowProps, MainWindowState } from '../interfaces';
import { IpcMessage } from '../constants';

class Index extends React.Component<MainWindowProps, MainWindowState>{
    constructor(params: Readonly<MainWindowProps>) {
        super(params);
        const { ipc } = this.props;

        this.state = {
            port: 80,
            status: '',
            runnning: false
        };

        ipc.on(IpcMessage.UPDATE_STATUS, (event, data: MainWindowState) => {
            this.setState(data);
        })
    }

    handleChangeClick = () => {
        const { ipc } = this.props;
        const { port } = this.state;
        ipc.send(IpcMessage.CHANGE_PORT, { port });
    }

    handleStartClick = () => {
        const { ipc } = this.props;
        ipc.send(IpcMessage.START_SERVER);
    }

    handleStopClick = () => {
        const { ipc } = this.props;
        ipc.send(IpcMessage.STOP_SERVER);
    }

    render() {
        const { port, status, runnning } = this.state;
        return (
            <div>
                <p>{`Server running: ${runnning}`}</p>
                <p>{status}</p>
                <input type='number' value={port} onChange={e => this.setState({ port: Number(e.target.value) })} />
                <button type='button' onClick={this.handleChangeClick}>change</button>
                <button type='button' onClick={this.handleStartClick}>start</button>
                <button type='button' onClick={this.handleStopClick}>stop</button>
            </div>
        );
    }
}

export default Index;