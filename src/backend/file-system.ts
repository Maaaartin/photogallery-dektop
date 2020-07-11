import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';
import * as archiver from 'archiver';
import * as _ from 'lodash';

import { dirName } from '../constants';

export function deleteGallery(galleryName: string) {
    const folder = path.join(dirName, galleryName);
    return new Promise((resolve, reject) => {
        fs.readdir(folder, (err, files) => {
            if (err) return reject(err);
            Promise.map(files, (file) => {
                return new Promise((resolve, reject) => {
                    fs.unlink(path.join(folder, file), (err) => {
                        if (err) return reject(err);
                        resolve();
                    })
                });
            })
                .then(() => {
                    fs.rmdir(folder, (err) => {
                        if (err) return reject(err);
                        resolve();
                    })
                }).catch((err) => {
                    console.log('error6');
                    console.log(err.message);
                    reject(err);
                });
        });
    });
}

export function zipDirectory(source: string, out: string) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

export function deleteFile(folderPath: string, fileName: string, attribute?: string): void {
    try { fs.unlinkSync(path.join(folderPath, fileName)); }
    catch (e) {
        console.log('error1');
        console.log(e.message);
    }
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        if (_.isEmpty(files)) fs.rmdirSync(folderPath);
    }
    if (attribute) throw new Error(`${attribute} for ${fileName} is not valid, image not saved`);
}