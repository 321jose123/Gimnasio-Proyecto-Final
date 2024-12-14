const { listFilesAndDirectories } = require('../utils/fileLister');

function showDirectoryTreeIfEnabled(directoryPath) {
  if (process.env.SHOWTREEDIRECTORYLIST === 'true') {
    const filesAndDirs = listFilesAndDirectories(directoryPath);
    console.log(filesAndDirs.join('\n'));
  } else {
    console.error('La lista de directorios en formato árbol está deshabilitada.');
  }
}

module.exports = {
  showDirectoryTreeIfEnabled
};
