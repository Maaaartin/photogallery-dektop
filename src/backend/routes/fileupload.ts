import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import { File, Files, IncomingForm } from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { GifUtil } from 'gifwrap';

import { deleteFile, deleteGallery } from '../file-system';
import { UploadFormFields, NameJimp } from '../../interfaces';
import { dirName } from '../../constants';

const router = Router();

/**
 * Modifies image files and saves them
 * @param data Array of files to be modified
 * @param width width in pixels
 * @param height height in pixels
 * @param x horizontal  offset
 * @param y vertical offset
 * @param title gallery name
 * @returns modified files
 */
function modifyCollection(data: File[], width: number, height: number, x: number, y: number, title: string): Promise<any[]> {
    return Promise.map(data, value => {
        return new Promise((resolve, reject) => {
            const folderPath = path.join(dirName, title);
            const oldpath = value.path;
            const newpath = path.join(folderPath, value.name); // dirName + value.name;
            const extName = path.extname(value.name);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(path.join(dirName, title));
            }
            fs.renameSync(oldpath, newpath);
            // tiff not supported
            if (extName === '.tiff') {
                deleteFile(folderPath, value.name);
                throw new Error('TIFF is not supported');
            };
            // gif requires special handling
            if (extName === '.gif') {
                GifUtil.read(newpath)
                    .then((image) => {
                        if (height && width) {
                            const imgWidth = image.width;
                            const imgHeight = image.height;

                            if (height >= imgHeight) {
                                return deleteFile(folderPath, value.name, 'Height');
                            }

                            if (width >= imgWidth) {
                                return deleteFile(folderPath, value.name, 'Width');
                            }

                            const xOffset = x || (imgWidth - width) / 2;
                            const yOffset = y || (imgHeight - height) / 2;

                            if (xOffset + width > imgWidth) {
                                return deleteFile(folderPath, value.name, 'Horizontal offset');
                            }

                            if (yOffset + height > imgHeight) {
                                return deleteFile(folderPath, value.name, 'Vertical offset');
                            }

                            for (const frame of image.frames) {
                                frame.reframe(xOffset, yOffset, width, height);
                            }
                            GifUtil.write(newpath, image.frames, image).then(outputGif => {
                                console.log("modified");
                                resolve({ name: value.name, bitmap: { width: image.width, height: image.height } });
                            })
                                .catch((err) => {
                                    console.log('error1');
                                    deleteFile(folderPath, value.name);
                                    reject(err);
                                });
                        }

                        resolve({ name: value.name, bitmap: { width: image.width, height: image.height } });
                    }).catch((err) => {
                        console.log('Gif error');
                        deleteFile(folderPath, value.name);
                        // deleteGallery(title);
                        reject(err);
                    });
            }
            else Jimp.read(newpath)
                .then((image: NameJimp) => {
                    image.name = value.name;
                    if (height && width) {
                        const imgWidth = image.getWidth();
                        const imgHeight = image.getHeight();

                        if (height >= imgHeight) {
                            return deleteFile(folderPath, image.name, 'Height');
                        }

                        if (width >= imgWidth) {
                            return deleteFile(folderPath, image.name, 'Width');
                        }

                        const xOffset = x || (imgWidth - width) / 2;
                        const yOffset = y || (imgHeight - height) / 2;

                        if (xOffset + width > imgWidth) {
                            return deleteFile(folderPath, image.name, 'Horizontal offset');
                        }

                        if (yOffset + height > imgHeight) {
                            return deleteFile(folderPath, image.name, 'Vertical offset');
                        }

                        image
                            .cropQuiet(xOffset, yOffset, width, height)
                            .write(path.join(dirName, title, image.name))
                    }

                    resolve(image);
                })
                .catch((err) => {
                    console.log('Jimp Error');
                    console.log(err.message);
                    deleteFile(folderPath, value.name);
                    // deleteGallery(title);
                    reject(err);
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
                console.log('error2');
                res.status(500).send(err.message);
            });
    });
});

export default router;