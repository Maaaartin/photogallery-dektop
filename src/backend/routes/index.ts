import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { imageSize } from 'image-size';

import { deleteGallery, zipDirectory } from '../file-system';
import { TitleReq, NameReq } from '../../interfaces';
import { dirName, tmpDir } from '../../constants';

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
        console.log('error3');
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
        console.log('one');
        const result = images.map((item) => {
            console.log('two');
            const sizeObj = imageSize(path.join(folder, item));
            console.log('three');
            return {
                data: fs.readFileSync(path.join(folder, item)).toString('base64'), // base64.base64(path.join(folder, item)),
                name: item,
                height: sizeObj.height,
                width: sizeObj.width
            }
        });
        console.log('four');
        res.status(200).send(result);
    }
    catch (e) {
        console.log('error4');
        console.log(e.message);
        res.status(404).send({ code: 404, message: e.message });
    }
});

router.get('/delete/:title/:name', (req: NameReq, res: Response) => {
    const { title, name } = req.params;
    console.log('delete file');
    try {
        fs.unlinkSync(path.join(dirName, title, name));
        res.status(200).send(`File ${name} from folder ${title} was deleted`);
    }
    catch (e) {
        console.log('caught delete file error');
        res.status(500).send(`Could not delete ${name} from folder ${title}`);
    }
});

/**
 * Endpoint for deleting of specified gallery
 */
router.get('/delete/:title', (req: TitleReq, res: Response) => {
    const title = req.params.title;
    console.log('delete folder');
    deleteGallery(title)
        .then(() => {
            res.status(200).send();
        }).catch((err) => {
            res.status(500).send({ code: 500, message: err.message });
        });
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
        console.log('error8');
        console.log(e.message);
        res.status(404).send({ code: 404, message: `Folder ${title} does not exist` });
    }
});

router.get('/download/:title/:name', (req: NameReq, res: Response) => {
    const { title, name } = req.params;
    try {
        const folder = path.join(dirName, title);

        console.log(`Download: ${name}`);

        res.download(path.join(folder, name));
    }
    catch (e) {
        console.log('error9');
        console.log(e.message);
        res.status(404).send({ code: 404, message: e.message });
    }
});

router.get('/download/:title', (req: TitleReq, res: Response) => {
    const { title } = req.params;
    if (!fs.existsSync(path.join(dirName, title))) {
        return res.status(404).send('Gallery does not exits');
    }
    const tmpGallery = path.join(tmpDir, title + '.zip');
    zipDirectory(path.join(dirName, title), tmpGallery)
        .then(() => {
            console.log('Zip created');
            res.on
            res.on('finish', () => {
                console.log('Response finished');
                fs.unlink(tmpGallery, (err) => {
                    if (err) console.log('Unlink zip error');
                });
            });
            res.download(tmpGallery);
        }).catch((err) => {
            console.log('Zip error');
            res.on('finish', () => {
                fs.unlink(tmpGallery, (err) => {
                    if (err) console.log('Unlink zip error');
                });
            });
            res.status(500).send(err.message);
        });
});

export default router;
