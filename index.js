'use strict';
const fs = require('fs');
const sizeOf = require('image-size');

const MAX_TRIES = 10;
const FILES_FILTER = ['png', 'jpg'];
const DRY_RUN = true;
const DIRECTORY = './';

const fileNames = fs.readdirSync(DIRECTORY);
const fileObjects = fileNames.map(file => {
  const path = DIRECTORY.slice(-1) === '/' ? DIRECTORY : DIRECTORY + '/';
  return {
    name: file,
    path: path,
    fullPath: `${path}${file}`,
    type: file.split('.').pop(),
    isDir: fs.lstatSync(path + file).isDirectory(),
  }
});

// const dirs = fileObjects.filter(fileObj => fileObj.isDir);
const files = fileObjects.filter(fileObj => !fileObj.isDir);
const filteredFiles = files
  .filter(fileObj => FILES_FILTER.includes(fileObj.type))
  .map(fileObj => {
    const { width, height, type } = sizeOf(fileObj.fullPath);
    const newPath = `${fileObj.path}${width}x${height}`;
    fileObj.dimensions = { w: width, h: height }
    fileObj.newPath = newPath;
    return fileObj;
  });

if (DRY_RUN) {
  console.log('--- DRY RUN ---');
  console.log('No files changed');
}

for(const fileObj of filteredFiles) {
  let renameComplete = false;
  let timesTried = 0;

  while(!renameComplete && timesTried < MAX_TRIES) {
    let newPathWithTimes = timesTried > 0 ? `${fileObj.newPath}(${timesTried}).${fileObj.type}` : `${fileObj.newPath}.${fileObj.type}`;

    try {
      fs.accessSync(newPathWithTimes, fs.constants.F_OK);
      // File exists
      timesTried++;
    } catch (err) {
      // File does not exist
      if (!DRY_RUN) {
        fs.renameSync(fileObj.fullPath, newPathWithTimes);
      }

      console.log(`${fileObj.fullPath} --> ${newPathWithTimes}`);
      renameComplete = true;
    }
  }
}