import * as express from 'express';
import * as fs from 'fs';
import index from './routes/index';
import fileupload from './routes/fileupload';
import * as  bodyParser from 'body-parser';
import * as path from 'path';
import { dirName } from '../constants';

if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
}

const app = express();

app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const buildFolder = express.static(path.join(__dirname, 'public'));
// TODO manage routes, get rid of old frontend
app.use('/api', index);
app.use('/fileupload', fileupload);
app.use('/', buildFolder);
app.use('*', buildFolder);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    res.send({ message: err.message, error: {} });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err: any, req, res: express.Response, next) => {
        res.status(err['status'] || 500);
        res.send({ message: err.message, error: {} });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req, res, next) => {
    res.status(err.status || 500);
    res.send({ message: err.message, error: {} });
});

app.set('port', process.env.PORT || 80);

const startServer = (callback: Function) => {
    const server = app.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
        callback(server);
    });
}

export default startServer;