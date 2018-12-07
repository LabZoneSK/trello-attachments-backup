const fs = require('fs')
const path = require('path')

const absolutePath = (folder) => {
  return path.resolve(__dirname, folder);
}

function* walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const pathToFile = path.join(dir, file);
    const isDirectory = fs.statSync(pathToFile).isDirectory();
    if (isDirectory) {
      yield* walk(pathToFile);
    } else {
      yield pathToFile;
    }
  }
}

module.exports = {
  absolutePath,
  walk
}