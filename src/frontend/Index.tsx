import * as React from 'react';
import { MainWindow } from '../interfaces';

class Index extends React.Component<MainWindow, any>{
    constructor(params: Readonly<MainWindow>) {
        super(params);
        const { ipc } = this.props;

        this.state = {
            port: 80
        }

        ipc.on('test', (event, data) => {
            console.log(data);
        });
    }

    handleClick = () => {
        const { ipc } = this.props;
        const { port } = this.state;
        ipc.send('changePort', { port });
    }

    render() {
        const { port } = this.state;
        return (
            <div>hello
                <input type='number' value={port} onChange={e => this.setState({ port: e.target.value })} />
                <button type='button' onClick={this.handleClick}> change</button>
            </div>
        );
    }
}

export default Index;