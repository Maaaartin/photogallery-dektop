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
        const { port, status, runnning } = this.state
        return (
            <Grid>
                <Row>
                    <Col xs={6}><span>{`Server running: ${runnning}`}</span></Col>
                    <Col xs={6}>
                        <span>{status}</span>
                    </Col>
                </Row>
                <Row>
                    <Col xs={6}>
                        <label >Port: </label>
                    </Col>
                    <Col xs={6}>
                        <input type='number' value={port} onChange={e => this.setState({ port: Number(e.target.value) })} />
                    </Col>
                </Row>
                <Row>
                    <Col xs={4}>
                        <Button type='button' onClick={this.handleChangeClick}>change</Button>
                        {/* <button type='button' onClick={this.handleChangeClick}>change</button> */}
                    </Col>
                    <Col xs={4}><Button type='button' onClick={this.handleStopClick}>stop</Button></Col>
                    <Col xs={4}><Button type='button' onClick={this.handleStartClick}>start</Button></Col>
                </Row>
            </Grid>
        );
    }
}

export default Index;