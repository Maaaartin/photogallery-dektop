import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Index, TitleReq, NameReq } from '../../interfaces';
import { dirName } from '../../constants';
import * as Promise from 'bluebird';
import { imageSize } from 'image-size';

// TODO better resizing
const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.send('hello');
});

router.get('/delete', (req: Request, res: Response) => {
    const files = fs.readdirSync(dirName);
    for (let file of files) {
        try { fs.unlinkSync(path.join(dirName, file)); }
        catch (e) { console.log(e.message); }
    }
    res.redirect('/');
});

router.get('/img', (req: Request, res: Response) => {
    try {
        const galleries = fs.readdirSync(dirName)
            .filter(f => fs.statSync(path.join(dirName, f)).isDirectory());
        res.status(200).send(galleries);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

router.get('/img/:title', (req: TitleReq, res: Response) => {
    const title = req.params.title;
    try {
        const folder = path.join(dirName, title);
        const images = fs.readdirSync(folder);
        const result = images.map((item) => {
            const sizeObj = imageSize(path.join(folder, item));
            return {
                data: fs.readFileSync(path.join(folder, item)).toString('base64'), // base64.base64(path.join(folder, item)),
                name: item,
                height: sizeObj.height,
                width: sizeObj.width
            }
        });
        res.status(200).send(result);
    }
    catch (e) {
        console.log(e.message);
        res.status(404).send({ code: 404, message: e.message });
    }
});

router.get('/img/delete/:title', (req: TitleReq, res: Response) => {
    const title = req.params.title;
    const folder = path.join(dirName, title);
    try {
        const files = fs.readdirSync(folder);
        Promise.map(files, (file) => {
            return new Promise((resolve, reject) => {
                fs.unlink(path.join(folder, file), (err) => {
                    if (err) return reject(err);
                    resolve();
                })
            });
        })
            .then(() => {
                fs.rmdirSync(folder);
                res.status(200).send();
            }).catch((err) => {
                console.log(err.message);
                res.status(500).send({ code: 500, message: err.message });
            });

    }
    catch (e) {
        console.log(e.message);
        res.status(404).send({ code: 404, message: e.message });
    }
});

// TODO send base64 images + read sizes in frontend
router.get('/img/:title/:name', (req: NameReq, res: Response) => {
    const { title, name } = req.params;
    try {
        const images = fs.readFileSync(path.join(dirName, title, name));
        res.status(200).send(images);
    }
    catch (e) {
        console.log(e.message);
        res.status(404).send({ code: 404, message: `Folder ${title} does not exist` });
    }
});

// Redirects to gallery page
router.post('/showcurrent', (req: Request, res: Response) => {
    res.redirect('/fileupload/' + 10);
});

export default router;
