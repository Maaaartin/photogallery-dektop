import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import { File, Files, IncomingForm } from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';

import { UploadFormFields, NameJimp } from '../../interfaces';
import { dirName } from '../../constants';

const router = Router();

function deleteFile(folderPath: string, fileName: string, attribute: string): void {
    try { fs.unlinkSync(path.join(folderPath, fileName)); }
    catch (e) { console.log(e.message); }
    throw new Error(`${attribute} for ${fileName} is not valid, image not saved`);
}

/**
 * Modifies image files and saves them
 * @param data Array of files to be modified
 * @param width width in pixels
 * @param height height in pixels
 * @param title gallery name
 * @returns modified files
 */
function modifyCollection(data: File[], width: number, height: number, x: number, y: number, title: string): Promise<NameJimp[]> {
    return Promise.map(data, value => {
        return new Promise((resolve, reject) => {
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
                        const imgWidth = image.getWidth();
                        const imgHeight = image.getHeight();

                        if (height > imgHeight) {
                            deleteFile(folderPath, image.name, 'Height');
                        }

                        if (width > imgWidth) {
                            deleteFile(folderPath, image.name, 'Width');
                        }

                        const xOffset = x || (imgWidth - width) / 2;
                        const yOffset = y || (imgHeight - height) / 2;

                        if (xOffset + width > imgWidth) {
                            deleteFile(folderPath, image.name, 'Horizontal offset');
                        }

                        if (yOffset + width > imgWidth) {
                            deleteFile(folderPath, image.name, 'Vertical offset');
                        }

                        image
                            .cropQuiet(xOffset, yOffset, width, height)
                            // .resize(width, height) // resize
                            // .write(dirName + image.name); // save
                            .write(path.join(dirName, title, image.name));
                    }

                    resolve(image);
                })
                .catch((err) => {
                    reject(err);
                    console.log(err.message);
                });
        });
    });
}

/**
 * Handles files uploads
 */
router.post('/', (req: Request, res: Response) => {
    // moves image from temporal folder to server folder
    const form = new IncomingForm();
    // Form may contain multiple files
    form.multiples = true;
    form.parse(req, function (err: Error, fields: UploadFormFields, files: Files) {
        // Contains actual uploaded files
        if (err) {
            res.status(500).send(err);
            return;
        }
        const data = (files.filetoupload instanceof Array) ? <File[]>files.filetoupload : [files.filetoupload];
        if (_.isEmpty(data)) {
            res.status(500).send("No files selected");
            return;
        }
        const height = Number(fields.height);
        const width = Number(fields.width);
        const previews = Number(fields.previews);
        const x = Number(fields.x);
        const y = Number(fields.y);
        const title = fields.title;

        modifyCollection(data, width, height, x, y, title)
            .then(images => {
                const files = images.map(item => ({
                    name: item.name,
                    width: item.bitmap.width,
                    height: item.bitmap.height
                }));
                res.status(200).send({ files, previews });
            })
            .catch((err) => {
                res.status(500).send(err.message);
            });
    });
});

export default router;