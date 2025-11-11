const fs = require('fs');
const path = require('path');
require('dotenv').config();

function listFilesAndDirectories(directoryPath, depth = 0) {
    const result = [];

    function readDirRecursive(dirPath, depth) {
        const filesAndDirs = fs.readdirSync(dirPath);

        filesAndDirs.forEach(fileOrDir => {
            const fullPath = path.join(dirPath, fileOrDir);
            const stats = fs.statSync(fullPath);
            const prefix = ' '.repeat(depth * 4) + (depth > 0 ? '├── ' : '');

            if (stats.isDirectory()) {
                result.push(`${prefix}${fileOrDir}/`);
                readDirRecursive(fullPath, depth + 1);
            } else {
                result.push(`${prefix}${fileOrDir}`);
            }
        });
    }

    readDirRecursive(directoryPath, depth);
    return result;
}

module.exports = {
    listFilesAndDirectories
};
