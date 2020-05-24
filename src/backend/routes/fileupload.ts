import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import { File, Files, IncomingForm } from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { Gallery, CountRequest, UploadFormFields, NameJimp } from '../../interfaces';
import { dirName } from '../../constants';
import * as path from 'path';

const router = Router();
// TODO check unused modules
function modifyCollection(data: File[], width: number, height: number, title: string): Promise<NameJimp[]> {
    return Promise.map(data, value => {
        return new Promise(resolve => {
            const folderPath = path.join(dirName, title);
            const oldpath = value.path;
            const newpath = path.join(folderPath, value.name); // dirName + value.name;
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(path.join(dirName, title));
            }
            fs.renameSync(oldpath, newpath);
            Jimp.read(newpath)
                .then((image: NameJimp) => {
                    image.name = value.name;
                    if (height && width) {
                        image
                            .resize(width, height) // resize
                            // .write(dirName + image.name); // save
                            .write(path.join(dirName, title, image.name));
                    }

                    resolve(image);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    })
}

// TODO fix resizing
// Handles files uploads
router.post('/', (req: Request, res: Response, next) => {
    // moves image from temporal folder to server folder
    const form = new IncomingForm();
    // Form may contain multiple files
    form.multiples = true;
    form.parse(req, function (err: Error, fields: UploadFormFields, files: Files) {
        // Contains actual uploaded files
        if (err) {
            // next(err);
            res.status(500).send(err);
            return;
        }
        const data = (files.filetoupload instanceof Array) ? <File[]>files.filetoupload : [files.filetoupload];
        if (_.isEmpty(data)) {
            res.status(500).send(new Error("No files selected"));
            // next(new Error("No files selected"));
            return;
        }
        const height = Number(fields.height);
        const width = Number(fields.width);
        const previews = Number(fields.previews);
        const title = fields.title;

        modifyCollection(data, width, height, title)
            .then(images => {
                const files = images.map(item => ({
                    name: item.name,
                    width: item.bitmap.width,
                    height: item.bitmap.height
                }));
                res.status(200).send({ files, previews });
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send(err);
            });
    });
});

// Provides gallery page
router.get('/:count', (req: CountRequest, res: Response, next) => {
    const count = req.params.count;
    if (!count || count < 1) {
        next(new Error("Invalid previews count"));
        return;
    }
    const files = fs.readdirSync('./' + dirName);
    // adjust the file path
    // handlebars require base64 data format
    // files.forEach((value, index, files) => {
    //     files[index] = (base64Img.base64Sync(dirName + value));
    // });
    const galleryFiles: Gallery = { files };
    res.render('gallery', { ...galleryFiles });
});

export default router;