import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';
import { imageSize } from 'image-size';

import { TitleReq, NameReq } from '../../interfaces';
import { dirName } from '../../constants';

const router = Router();

/**
 * API endpoint for images
 */
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

/**
 * Endpoint for reading content of specified gallery
 */
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

router.get('/delete/:title/:name', (req: NameReq, res: Response) => {
    const { title, name } = req.params;
    try {
        fs.unlink(path.join(dirName, title, name));
        res.status(200).send(`File ${name} from folder ${title} was deleted`);
    }
    catch (e) {
        res.status(500).send(`Could not delete ${name} from folder ${title}`);
    }
});

/**
 * Endpoint for deleting of specified gallery
 */
router.get('/delete/:title', (req: TitleReq, res: Response) => {
    const title = req.params.title;
    const folder = path.join(dirName, title);
    console.log('delete folder');
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

/**
 * Endpoint getting specified image in specified gallery
 */
router.get('/img/:title/:name', (req: NameReq, res: Response) => {
    console.log('/img/:title/:name');
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

export default router;
