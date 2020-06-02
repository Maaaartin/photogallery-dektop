import * as React from 'react';
import { Grid, Col, Row } from 'react-styled-flexboxgrid';
import styled from 'styled-components';

import { MainWindowProps, MainWindowState } from '../interfaces';
import { IpcMessage } from '../constants';

const Button = styled.button`
background-color: blue;
border: none;
color: white;
padding: 10px 20px;
text-align: center;
text-decoration: none;
display: inline-block;
font-size: 16px;
margin: 4px 2px;
cursor: pointer;
border-radius: 8px;
transition-duration: 0.4s;
:hover {
    background-color: #a1c2f0; 
    color: white;
}
`;

class Index extends React.Component<MainWindowProps, MainWindowState>{
    constructor(params: Readonly<MainWindowProps>) {
        super(params);
        const { ipc } = this.props;

        this.state = {
            setPort: 80,
            status: '',
            runnning: false
        };

        ipc.on(IpcMessage.UPDATE_STATUS, (event, data: MainWindowState) => {
            this.setState(data);
        })
    }

    handleBrowserClick = () => {
        const { ipc } = this.props;
        ipc.send(IpcMessage.OPEN_BROWSER);
    }

    handleChangeClick = () => {
        const { ipc } = this.props;
        const { setPort } = this.state;
        ipc.send(IpcMessage.CHANGE_PORT, { setPort });
    }

    handleStopStartClick = () => {
        const { ipc } = this.props;
        const { runnning } = this.state;
        ipc.send(runnning ? IpcMessage.STOP_SERVER : IpcMessage.START_SERVER);
    }

    render() {
        const { setPort, servePort, status, runnning, disable } = this.state;
        const rowStyle: React.CSSProperties = { marginBottom: '30px', textAlign: 'center' };
        const buttonStyle: React.CSSProperties = disable ? { backgroundColor: 'grey', cursor: 'not-allowed' } : {};
        return (
            <Grid>
                <Row style={rowStyle}>
                    <Col xs={6}><span>{runnning ? `Server running on port ${servePort}` : 'Server not running'}</span></Col>
                    <Col xs={6}>
                        <span>{status}</span>
                    </Col>
                </Row>
                <Row center='xs' style={rowStyle}>
                    <Col xs={12}>
                        <label >Port: </label>
                        <input type='number' value={setPort} onChange={e => this.setState({ setPort: Number(e.target.value) })} />
                    </Col>
                </Row>
                <Row>
                    <Col xs={4}>
                        <Button style={buttonStyle} type='button' onClick={!disable && this.handleChangeClick}>change</Button>
                    </Col>
                    <Col xs={4}><Button
                        style={buttonStyle}
                        type='button'
                        onClick={!disable && this.handleStopStartClick}>{runnning ? 'stop' : 'start'}
                    </Button>
                    </Col>
                    <Col xs={4}>
                        <Button
                            style={buttonStyle}
                            type='button'
                            onClick={!disable && this.handleBrowserClick}>open browser</Button>
                    </Col>
                </Row>
            </Grid>
        );
    }
}

export default Index;